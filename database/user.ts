import UserInterface from "@/interfaces/User";
import { getDB } from "./db";
import { ContraceptionMethods } from "@/enums/ContraceptionMethod";
import { toast, ToastPosition } from "@backpackapp-io/react-native-toast";


/**
 * Create the user table.
 */
export async function createUserTable(): Promise<void> {
  const db = await getDB();

  try {
    db.execAsync(`
      CREATE TABLE IF NOT EXISTS User (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        method TEXT,
        startDate TEXT
      );
    `);
  }
  catch (error) {
    toast.error("Error while trying to create user table : " + error, { position: ToastPosition.BOTTOM });
  }
}


/**
 * Get the only user
 * @returns 
 */
export async function getUser(): Promise<UserInterface | null> {
  const db = await getDB();

  try {
    const user = await db.getFirstAsync<UserInterface>('SELECT * FROM User');

    if(!user) return null;

    return deserializeUser(user);
  }
  catch (error) {
    toast.error("Error when trying to fetch user : " + error, { position: ToastPosition.BOTTOM });
    return null;
  }
}


/**
 * Create a user.
 * @param method The contraception method.
 * @returns 
 */
export async function createUser(method: ContraceptionMethods|null = null, startDate: string|null = null): Promise<number | null> {
  const theUser = await getUser();

  if(theUser == null) {
    const db = await getDB();

    try {
      const statement = await db.prepareAsync(
        'INSERT INTO User (method, startDate) VALUES (?, ?)'
      );

      const result = await statement.executeAsync([method, startDate]);

      return result.lastInsertRowId;
    }
    catch (error) {
      toast.error("Error while trying to create user : " + error, { position: ToastPosition.BOTTOM });
      return null;
    }
  }
  else return theUser.id;
}


/**
 * Update a user.
 * @param updatedUser The updated user.
 */
export async function updateUser(id: number, method: ContraceptionMethods|null, startDate: string|null): Promise<void> {
  const db = await getDB();

  try {
    await db.runAsync("UPDATE User SET method = ?, startDate = ? WHERE id = ?", [method, startDate, id]);
  }
  catch (error) {
    toast.error("Error while trying to update user : " + error, { position: ToastPosition.BOTTOM });
  }
}


/**
 * Deserialize a user.
 * @param user The user to deserialize
 * @returns 
 */
export function deserializeUser(user: UserInterface): UserInterface {
  return {
    id: user.id,
    method: user.method,
    startDate: user.startDate === null ? null : new Date(user.startDate),
  }
}