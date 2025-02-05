# Worldly Database Structure

This document outlines the structure of the `wordly-db` database in Firebase. Each collection, its fields, types, and purposes are explained to assist developers in understanding and interacting with the database.

## Collections and Their Structure

### 1. `badges`
This collection stores information about badges available in the game.
- **Fields**:
  - `badgeName` (string): The name of the badge.
  - `continent` (string): The continent associated with the badge.
  - `description` (string): A description of the badge.
  - `timesRequired` (number): Number of times an achievement needs to be completed to earn the badge.

---

### 2. `challenges`
This collection stores data related to challenges between users.
- **Fields**:
  - `challengedId` (string): The ID of the user being challenged.
  - `challengerId` (string): The ID of the user initiating the challenge.
  - `status` (string): The status of the challenge (e.g., pending, accepted, completed).

---

### 3. `friendships`
This collection tracks relationships between users.
- **Fields**:
  - `status` (string): The status of the friendship ( pending, confirmed).
  - `requesterId` (string): ID of the user initiating the friendship.
  - `requesteeId` (string): ID of the second user in the friendship.

---

### 4. `gameCountries`
This collection tracks the countries guessed during games.
- **Fields**:
  - `continent` (string): The continent of the country.
  - `countryName` (string): The name of the country.
  - `gameId` (string): The ID of the associated game.
  - `isGuessed` (boolean): Whether the country was correctly guessed.

---

### 5. `gameParticipants`
This collection stores information about users participating in a game.
- **Fields**:
  - `countriesGuessed` (array of strings): List of countries guessed by the participant.
  - `gameId` (string): The ID of the associated game.
  - `score` (number): The score of the participant in the game.
  - `timeStamp` (timestamp): The time the participation record was created.
  - `userId` (string): The ID of the participant.

---

### 6. `games`
This collection holds metadata about games played.
- **Fields**:
  - `endTime` (timestamp): The time the game ended.
  - `gameType` (string): The type of the game (e.g., solo, multiplayer).
  - `startTime` (timestamp): The time the game started.
  - `status` (string): The current status of the game (e.g., in-progress, completed).
  - `winnerId` (string): The ID of the winning user.

---

### 7. `notifications`
This collection contains user notifications.
- **Fields**:
  - `isRead` (boolean): Whether the notification has been read.
  - `message` (string): The content of the notification.
  - `timeStamp` (timestamp): The time the notification was created.
  - `userId` (string): The ID of the user receiving the notification.

---

### 8. `userBadges`
This collection maps badges to users.
- **Fields**:
  - `badgeId` (string): The ID of the associated badge.
  - `earnedDate` (timestamp): The date the badge was earned.
  - `timesCompleted` (number): Number of times the badge criteria have been met.
  - `userId` (string): The ID of the user.

---

### 9. `users`
This collection stores user profile information.
- **Fields**:
  - `avatarUrl` (string): URL of the user's avatar image.
  - `email` (string): The email of the user.
  - `friends` (array of strings): List of friend IDs.
  - `level` (number): The user's current level.
  - `stats` (object): Nested object storing gameplay statistics:
    - `gamesPlayed` (number): Total games played by the user.
    - `gamesWon` (number): Total games won by the user.
  - `userId` (string): The unique ID of the user.
  - `username` (string): The username of the user.
  - `continentsTracked` (object): An object with keys for each continent
     (e.g., Africa, Asia, Europe, North America, South America, Oceania) and 
     values representing how many times the user has scored 100% on that continent.

---

## Notes
- **Timestamps**: Use Firebase's `timestamp` type for all time-related fields.
- **IDs**: Each document's ID uniquely identifies a record in its collection. Relationships between collections are typically established using these IDs.

This structure is designed to support a multiplayer geography game with user profiles, badges, challenges, and notifications. Feel free to extend the database as needed to accommodate new features.
