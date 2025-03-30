import { getDateDifference, getStartAndEndDate, isDateBetween } from "./date";
import { Status } from "@/enums/Status";
import { getSessionsStored, getSessionStore } from "@/store/SessionStore";
import { getContraceptionMethod } from "./contraception";
import { getUserStore } from "@/store/UserStore";
import { ContraceptionMethods } from "@/enums/ContraceptionMethod";
import { toast, ToastPosition } from "@backpackapp-io/react-native-toast";


/**
 * Calculate the total wearing from sessions.
 * @param sessions Sessions
 * @returns miliseconds
 */
export function calculateTotalWearing(sessions: SessionInterface[]): number {
  return sessions.reduce((previous, current) => {
    return previous + getDateDifference(current.dateTimeStart, current.dateTimeEnd ?? new Date());
  }, 0);
}

/**
 * Get the status from a total wearing.
 * @param totalWearing miliseconds (-1 = force to none status)
 * @returns
 */
export function getStatusFromTotalWearing(totalWearing: number): Status {
  const contraceptionMethod = getContraceptionMethod(getUserStore().getUser()?.method ?? ContraceptionMethods.ANDRO_SWITCH);

  if(totalWearing === -1) {
    return Status.NONE;
  }
  else if(totalWearing < contraceptionMethod.objective_min_extra) {
    return Status.FAILED;
  }
  else if(totalWearing < contraceptionMethod.objective_min) {
    return Status.WARNED;
  }
  else if(totalWearing < contraceptionMethod.objective_max) {
    return Status.SUCCESSED;
  }
  else if(totalWearing < contraceptionMethod.objective_max_extra) {
    return Status.REACHED;
  }
  else if(totalWearing >= contraceptionMethod.objective_max_extra) {
    return Status.EXCEEDED;
  }
  else {
    return Status.NONE;
  }
}

/**
 * Get the color of the status.
 * @param status The status
 */
export function getColorFromStatus(status: Status | string): string {
  switch(status) {
    case Status.FAILED:
      return '#FF5656';
    case Status.WARNED:
      return '#FFC249';
    case Status.SUCCESSED:
      return '#49B24E';
    case Status.REACHED:
      return '#6DDAFF';
    case Status.EXCEEDED:
      return '#D67FFF';
    default:
      return '#B5B5B5';
  }
}

/**
 * Extract sessions from a date.
 * @param sessions The sessions to iterate.
 * @param date The date from which extract the sessions.
 * @returns 
 */
export function extractDateSessions(sessions: SessionInterface[], date: Date): SessionInterface[] {
  const { dateStart, dateEnd } = getStartAndEndDate(date);

  return sessions.filter(session => {
    return isDateBetween(session.dateTimeStart, dateStart, dateEnd)
  });
}


/**
 * Does the sessions has sexWithoutProtection to true.
 * @param sessions The sessions to test.
 * @returns 
 */
export function hasSessionsSexWithoutProtection(sessions: SessionInterface[]): boolean {
  return sessions.some(session => session.sexWithoutProtection === true);
}


/**
 * Return if times are set correctly and if they don't override an other session, return the errors.
 * @param session The session reference.
 * @param startTime The strat time
 * @param endTime the end time
 * @returns 
 */
export function timeVerifications(session: SessionInterface, startTime: Date, endTime: Date): boolean {
  const sessionStore = getSessionStore();
  let ok = true;
  const errors = [];

  if(endTime > new Date()) {
    errors.push("L'heure de fin ne peut pas être supérieur à l'heure actuel");
    ok = false;
  }

  if(endTime <= startTime) {
    errors.push("L'heure de fin ne peut pas être inférieur ou égal à l'heure de début");
    ok = false;
  }
  else {
    const otherDateSessions = extractDateSessions(sessionStore.getSessions(), session.dateTimeStart).filter(thisSession => thisSession.id !== session.id);
    if(otherDateSessions.some(thisSession => {
      const maxEndTime = getStartAndEndDate(thisSession.dateTimeStart).dateEnd;
      return isDateBetween(startTime, thisSession.dateTimeStart, thisSession.dateTimeEnd ?? maxEndTime)
          || isDateBetween(thisSession.dateTimeStart, startTime, endTime)
    })) {
      errors.push("Les heures sélectionnées font se chevaucher une autre session");
      ok = false;
    }
  }

  errors.forEach(error => {
    toast.error(error, {
      position: ToastPosition.BOTTOM
    })
  })

  return ok;
}


/**
 * Caluclate the remaining time for the objective.
 * @param objective The objective to test
 * @param date The date to calculate remaning time
 * @returns 
 */
export function calculateObjectiveRemainingTime(objective: number, date: Date): number {
  const sessions = extractDateSessions(getSessionsStored(), date);
  const totalWearing = calculateTotalWearing(sessions);

  return objective - totalWearing;
}


/**
 * Calculate the time while the objective becomes unreachable.
 * @param objective The objective to test
 * @param date The reference date
 * @returns `-1 = reached`, `0 = unreachable`
 */
export function calculateTimeUntilUnreachableObjective(objective: number, date: Date): number {
  const sessions = extractDateSessions(getSessionStore().getSessions(), date);
  const totalWearing = calculateTotalWearing(sessions);

  if(totalWearing > objective) return -1;

  const now = new Date();
  const { dateStart, dateEnd} = getStartAndEndDate(date);

  if(!isDateBetween(now, dateStart, dateEnd)) return 0;

  const remainingTime = getDateDifference(now, dateEnd) - (objective - totalWearing);

  if(remainingTime <= 0) return 0;

  return remainingTime;
}


/**
 * Split session if needed.
 * @param session Session to split.
 * @returns 
 */
export function splitSessionsByDay(session: SessionInterface): SessionInterface[] {
  const sessions: SessionInterface[] = [];
  let currentStart = new Date(session.dateTimeStart);
  const now = new Date();

  do {
    const { dateStart, dateEnd } = getStartAndEndDate(currentStart);
    const currentEnd = dateEnd < (session.dateTimeEnd ?? now) ? dateEnd : session.dateTimeEnd;

    sessions.push({
      id: session.dateTimeStart.toISOString() === currentStart.toISOString() ? session.id : 0,
      dateTimeStart: new Date(currentStart),
      dateTimeEnd: currentEnd,
      sexWithoutProtection: session.sexWithoutProtection
    });

    currentStart = new Date(dateStart);
    currentStart.setDate(currentStart.getDate() + 1);
  } while (currentStart < (session.dateTimeEnd ?? now));

  return sessions;
}