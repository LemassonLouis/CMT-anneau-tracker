import { toast, ToastPosition } from "@backpackapp-io/react-native-toast";
import { getDB } from "./db";


/**
 * Migrate tables if needed (using pragma versions)
 */
export async function migrateTables(): Promise<void> {
  const db = await getDB();

  const NOTIFICATION_MIGRATION = 1;

  // TEMP : reset pragma version
  // await db.execAsync(`
  //   ALTER TABLE User DROP COLUMN wantFiveMinutesRemainingNotification;
  //   ALTER TABLE User DROP COLUMN wantOneHourRemainingNotification;
  //   ALTER TABLE User DROP COLUMN wantTwoHoursRemainingNotification;
  //   ALTER TABLE User DROP COLUMN wantObjectiveMinExtraReachedNotification;
  //   ALTER TABLE User DROP COLUMN wantObjectiveMinReachedNotification;
  //   ALTER TABLE User DROP COLUMN wantObjectiveMaxReachedNotification;
  //   ALTER TABLE User DROP COLUMN wantObjectiveMaxExtraReachedNotification;
  //   PRAGMA user_version = 0;
  // `);

  const [{ user_version }] = await db.getAllAsync<{ user_version: number }>(
    'PRAGMA user_version;'
  );


  // Notification migration
  if (user_version < NOTIFICATION_MIGRATION) {
    console.log(`migrate to version ${NOTIFICATION_MIGRATION}`)
    try {
      await db.execAsync(`
        ALTER TABLE User ADD COLUMN wantFiveMinutesRemainingNotification INTEGER DEFAULT 1;
        ALTER TABLE User ADD COLUMN wantOneHourRemainingNotification INTEGER DEFAULT 1;
        ALTER TABLE User ADD COLUMN wantTwoHoursRemainingNotification INTEGER DEFAULT 1;
        ALTER TABLE User ADD COLUMN wantObjectiveMinExtraReachedNotification INTEGER DEFAULT 1;
        ALTER TABLE User ADD COLUMN wantObjectiveMinReachedNotification INTEGER DEFAULT 1;
        ALTER TABLE User ADD COLUMN wantObjectiveMaxReachedNotification INTEGER DEFAULT 1;
        ALTER TABLE User ADD COLUMN wantObjectiveMaxExtraReachedNotification INTEGER DEFAULT 1;
        PRAGMA user_version = ${NOTIFICATION_MIGRATION};
      `);

      await db.execAsync(`
        UPDATE User SET
          wantFiveMinutesRemainingNotification = 1,
          wantOneHourRemainingNotification = 1,
          wantTwoHoursRemainingNotification = 1,
          wantObjectiveMinExtraReachedNotification = 1,
          wantObjectiveMinReachedNotification = 1,
          wantObjectiveMaxReachedNotification = 1,
          wantObjectiveMaxExtraReachedNotification = 1
        WHERE
          wantFiveMinutesRemainingNotification IS NULL OR
          wantOneHourRemainingNotification IS NULL OR
          wantTwoHoursRemainingNotification IS NULL OR
          wantObjectiveMinExtraReachedNotification IS NULL OR
          wantObjectiveMinReachedNotification IS NULL OR
          wantObjectiveMaxReachedNotification IS NULL OR
          wantObjectiveMaxExtraReachedNotification IS NULL;
      `);
    }
    catch (error) {
      toast.error(`Error while trying to migrate user table to version ${NOTIFICATION_MIGRATION} : ` + error, { position: ToastPosition.BOTTOM });
    }
  }

  // Next migration
  // if (user_version < ) {
  //   try {
  //     await db.execAsync(`

  //       PRAGMA user_version = ${};
  //     `);
  //   }
  //   catch (error) {
  //     toast.error(`Error while trying to migrate user table to version ${} : ` + error, { position: ToastPosition.BOTTOM })
  //   }
  // }
}