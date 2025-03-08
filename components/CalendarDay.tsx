import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import CalendarIcon from "./CalendarIcon";
import { useNavigation } from "expo-router";
import { isDateCurrentDay } from "@/services/date";
import { getStatusFromTotalWearing, calculateTotalWearing } from "@/services/session";
import React from "react";
import { NavigationProp } from "@react-navigation/native";

type NavigationType = NavigationProp<RootStackParamList, 'dayDetail'>;

function CalendarDay(day: DayInterface) {
  const navigation = useNavigation<NavigationType>();

  const handlePress = () => {
    navigation.navigate("dayDetail", { day: JSON.stringify(day) });
  };

  const totalWearing: number = calculateTotalWearing(day.sessions);
  const status: string = getStatusFromTotalWearing(totalWearing);
  const sexWithoutProtection: boolean = day.sessions.some(session => session?.sexWithoutProtection);

  return (
    <TouchableOpacity onPress={handlePress} style={[styles.calendarLink, isDateCurrentDay(day.date) && styles.calendarDayCurrentDay]}>
      <View style={[styles.calendarDay, !day.isCurrentMonth && styles.calendarDayNonCurrentMonth]}>
        <Text style={styles.calendarDayText}>{day.date.getDate()}</Text>
        <View>
          <CalendarIcon status={status} sexWithoutProtection={sexWithoutProtection} />
        </View>
      </View>
    </TouchableOpacity>
  )
}


export default React.memo(CalendarDay);


const styles = StyleSheet.create({
  calendarLink: {
    flex: 1/7,
    flexShrink: 0,
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 7,
    paddingTop: 7,
    borderRightWidth: 1,
    borderTopWidth: 1,
    borderRightColor: '#ddd',
    borderTopColor: '#ddd',
  },
  calendarDay: {
    alignItems: 'center',
    width: '100%',
  },
  calendarDayNonCurrentMonth: {
    opacity: 0.3
  },
  calendarDayCurrentDay: {
    backgroundColor: '#ddd',
  },
  calendarDayText: {
    marginBottom: 5
  },
})