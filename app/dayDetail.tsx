import CalendarIcon from "@/components/CalendarIcon";
import CreateSessionModal from "@/components/CreateSessionModal";
import CurrentSession from "@/components/CurrentSession";
import ProgressIndicator from "@/components/ProgressIndicator";
import Session from "@/components/Session";
import SexWithoutProtection from "@/components/sexWithoutProtection";
import { deserializeSession } from "@/database/session";
import { ContraceptionMethods } from "@/enums/ContraceptionMethod";
import { Status } from "@/enums/Status";
import { getContraceptionMethod } from "@/services/contraception";
import { isDateToday, isDateInUserContraceptionRange } from "@/services/date";
import { calculateTotalWearing, extractDateSessions, getColorFromStatus, getStatusFromTotalWearing } from "@/services/session";
import { getSessionsStored } from "@/store/SessionStore";
import { getUserStore } from "@/store/UserStore";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { View, Text, StyleSheet, Dimensions, FlatList, ScrollView, TouchableOpacity } from "react-native";
import * as Progress from 'react-native-progress';

const deserializeDay = (day: DayInterface): DayInterface => {
  return {
    date: new Date(day.date),
    isCurrentMonth: day.isCurrentMonth,
    sessions: day.sessions.map(session => deserializeSession(session))
  }
}

export default function dayDetail() {
  const params = useLocalSearchParams();
  const day = deserializeDay(JSON.parse(String(params.day)));
  const sessionsStored = getSessionsStored();

  const [currentSessions, setCurrentSessions] = useState<SessionInterface[]>(extractDateSessions(sessionsStored, day.date));
  const [totalWearing, setTotalWearing] = useState<number>(calculateTotalWearing(currentSessions));
  const [status, setStatus] = useState<string>(totalWearing > 0 || isDateInUserContraceptionRange(day.date) ? getStatusFromTotalWearing(totalWearing) : Status.NONE);
  const [sexWithoutProtection, setSexWithoutProtection] = useState<boolean>(currentSessions.some(session => session.sexWithoutProtection));
  const [createSessionModalVisible, setCreateSessionModalVisible] = useState<boolean>(false);

  const contraceptionMethod = getContraceptionMethod(getUserStore().getUser()?.method ?? ContraceptionMethods.ANDRO_SWITCH);
  const notSameObjectiveMinMax = contraceptionMethod.objective_min !== contraceptionMethod.objective_max;

  const progressBarWidth: number = Dimensions.get('window').width * 0.8;

  useEffect(() => {
    const currentSessions = extractDateSessions(sessionsStored, day.date);
    const newTotalWearing = calculateTotalWearing(currentSessions);
    const newStatus = isDateInUserContraceptionRange(day.date) ? getStatusFromTotalWearing(newTotalWearing) : Status.NONE;
    const newSexWithoutProtection = currentSessions.some(session => session.sexWithoutProtection);

    setCurrentSessions(currentSessions);
    setTotalWearing(newTotalWearing);
    setStatus(newStatus);
    setSexWithoutProtection(newSexWithoutProtection);
  }, [sessionsStored]);


  return (
    <ScrollView>
      <View style={styles.container}>
        <Text style={styles.title}> {day.date.toLocaleDateString('fr-FR', { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</Text>

        <View style={styles.iconContainer}>
          <CalendarIcon status={status} sexWithoutProtection={sexWithoutProtection} size={100} />
        </View>

        <View style={styles.progressContainer}>
          <Progress.Bar style={styles.progressBar} progress={totalWearing / 86_400_000} width={progressBarWidth} height={10} color={getColorFromStatus(status)}/>
          <ProgressIndicator hour={contraceptionMethod.objective_min_extra / 3_600_000} progressBarWidth={progressBarWidth} isTop={false} />
          <ProgressIndicator hour={contraceptionMethod.objective_min / 3_600_000} progressBarWidth={progressBarWidth} isTop={true} />
          {notSameObjectiveMinMax && <ProgressIndicator hour={contraceptionMethod.objective_max / 3_600_000} progressBarWidth={progressBarWidth} isTop={false} />}
          <ProgressIndicator hour={contraceptionMethod.objective_max_extra / 3_600_000} progressBarWidth={progressBarWidth} isTop={notSameObjectiveMinMax} />
        </View>

        <View style={styles.currentSession}>
          {isDateToday(day.date) ? <CurrentSession/> : <SexWithoutProtection date={day.date}/>}
        </View>

        <FlatList
          style={styles.sessions}
          numColumns={1}
          scrollEnabled={false}
          data={currentSessions}
          keyExtractor={session => session.id.toString()}
          renderItem={({item}) => <Session {...item}/>}
        />

        {(totalWearing > 0 || isDateInUserContraceptionRange(day.date)) && <>
          <TouchableOpacity style={styles.plusButton} onPress={() => setCreateSessionModalVisible(true)}>
            <Feather name='plus' size={35} color='#000'/>
          </TouchableOpacity>

          <CreateSessionModal
            date={day.date}
            sexWithoutProtection={sexWithoutProtection}
            visible={createSessionModalVisible}
            setVisible={setCreateSessionModalVisible}
          />
        </>}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    padding: 20,
  },
  title: {
    marginBottom: 20,
    fontSize: 24,
    fontWeight: "bold",
    textTransform: 'capitalize',
  },
  iconContainer: {
    marginBottom: 20,
  },
  progressContainer: {
    position: 'relative',
    marginTop: 15,
  },
  progressBar: {
    // flex: 1
  },
  currentSession: {
    width: '100%',
    marginTop: 50,
  },
  sessions: {
    width: '80%',
    marginTop: 10,
  },
  plusButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#ddd',
    borderRadius: 50,
  }
});