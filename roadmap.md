# ROADMAP.md

## 1. Overview

**Project Name:** Worldly  
**Description:** A fast-paced, real-time multiplayer geography game built in React Native (Expo) for iOS & Android, with Firebase (Auth, Firestore) as the backend and Socket.IO for real-time communication. Users can challenge friends or play solo, and earn badges by naming countries.

Key Points:

- **Frontend:** React Native + Expo 
(Expo Go mobile app for testing on your phone) 
- **Backend:** Firebase (Auth, Firestore), plus serverless endpoints (Cloud Functions or external server) for custom logic as needed. Would love to use the premade UI for the sign in and sign up screens, as long as it can be integrated with the rest of the app, and styled to match the rest of the app.
- **Profile Images:** We will not be using the Firebase Storage for profile images. Instead, we will be using an avatar generator library. Other small files will be stored locally in the assets folder.

To keep things **simple, fun, and lightweight**, the game uses **[Multiavatar](https://multiavatar.com/)** to generate unique, random profile pictures for each user upon sign-up.  

#### **How It Works:**  
- When a new user **registers**, they are automatically assigned a **randomly generated avatar** from Multiavatar.  
- This avatar serves as their **permanent profile picture** and does **not** change between sessions.  
- Since the avatars are **algorithmically generated**, there is **no need to store image files**, reducing complexity and keeping the game streamlined.  

This approach adds a **cute element** to the game while ensuring each player has a distinct visual identity without requiring manual uploads or storage management.

- **Real-Time:** Socket.IO for live multiplayer updates (can be integrated via a Node.js server or via Cloud Functions if using a socket-based approach)  
- **Map & Geography Data:** Google Maps / Mapbox for map rendering + REST-based country data validation  
if there are any other APIs that would be better for this, please let me know. We are going to need a blank map to start with, and then the colors will fill in particular countries as they are guessed.
- **Notifications:** Expo Push Notifications. We need to be able to send push notifications to users when they receive a challenge.
- **Deployment:** 
  - iOS: Apple App Store via Xcode + Transporter (or EAS build and submit)  
  - Android: Google Play Store via EAS build and upload to Play Console  

---

## 2. Tech Stack & Dependencies

### Core Technologies
1. **React Native (Expo)**
2. **Firebase**  
   - Authentication (using FirebaseUI for sign-in flows)  
   - Firestore (realtime DB and store game states, users, challenges, badges)   
   - Cloud Functions (optional, for serverless logic: e.g., challenge notifications)  
3. **Socket.IO** (real-time game sessions, or an alternative real-time approach with Firestore if you prefer fewer external servers)  
4. **Geo APIs** (for validating country names, retrieving country metadata)  
   - Could be [Geography4 API](https://rapidapi.com/mmplabsadm/api/geography4), or [apilayer’s geo-api](https://apilayer.com/marketplace/geo-api).  
5. **Map Rendering**  
   - **Google Maps** (React Native Maps) or **Mapbox** for interactive map displays.  

### Recommended Libraries
- **React Navigation** for multi-screen navigation & bottom tabs.  
- **Fetch** for calls to geography APIs. We will not be using axios.
- **Socket.IO Client** for connecting to the multiplayer server.  
- **Expo Contacts** (for contact syncing, if needed)  
- **Expo Push Notifications** (alternative to Firebase Cloud Messaging if you’re staying fully in Expo)  
- **React Native Reanimated** – Provides performant animations using the native driver. Smooth animations are a must.
- **React Native Gesture Handler** – Handles gestures efficiently and works well with Reanimated for smooth UI interactions.

---

## 3. Project Structure

A suggested folder hierarchy within your Expo project, does not have to be followed exactly, but should be used as a guide:

```
 ┣─ src/                 
 ┃   ┣─ components/
 ┃   ┃   ┣─ MapView/
 ┃   ┃   ┣─ Badge/
 ┃   ┃   ┗─ ...
 ┃   ┣─ components/
 ┃   ┃   ┣─ Auth/
 ┃   ┃   ┃   ┣─ SignInScreen.jsx
 ┃   ┃   ┃   ┗─ SignUpScreen.jsx
 ┃   ┃   ┣─ HomeScreen.jsx (profile page, settings button, badges, stats, etc.)
 ┃   ┃   ┣─ FriendsListScreen.jsx (friends list, remove friend button)
 ┃   ┃   ┣─ FriendSearchScreen.jsx (friend search screen. allows the user to search for users by username and add them as a friend. users can only challenge friends that are in their friends list.)
 ┃   ┃   ┣─ FriendProfileScreen.jsx (friend profile page. very similar to the home screen, but for a friend)
 ┃   ┃   ┣─ PendingRoom.jsx (pending challenge component. this is where a user waits for a challenge to be accepted or the game to start. it will have a button to leave the room cancelling the challenge, and a button to start the game once the other player has joined. if the other player cancels the challenge, the user will be notified and the pending room will be closed. if the joining user joins the room, they will see a "waiting for other player to start the game" message, and the challenger will be allowed to click the start game button, which will start the game and redirect the user to the game page.)
 ┃   ┃   ┣─ MissedChallengesLogScreen.jsx (missed challenges log page. shows a list of missed challenges and a button to reissue a challenge.)
 ┃   ┃   ┣─ GamePlayScreen.jsx (game page. this is where the game is played. it will have a map, a text input for the user to guess the country, a timer, and a button to leave the game. if the user leaves the game, the game will end and the user will be redirected to the home screen.)
 |   |   |- GameScreen.jsx (the page used to initiate a game. has a challenge button)
 ┃   ┃   ┣─ Winner.jsx (injected into game summary screen)
 ┃   ┃   ┣─ Loser.jsx (injected into game summary screen)
 ┃   ┃   ┣─ Tie.jsx (injected into game summary screen)
 ┃   ┃   ┣─ GameSummaryScreen.jsx (game summary screen. shows the winner, loser, or tie)
 ┃   ┃   ┣─ BadgesScreen.jsx (badges screen. shows a list of badges and the user's progress towards earning them.)
 ┃   ┃   ┣─ ProfileSettingsScreen.jsx (profile settings screen. allows the user to change their password.)
 ┃   ┃   ┣─ SyncContactsScreen.jsx (sync contacts screen. allows the user to sync their contacts with the app.)
 ┃   ┃   ┗─ AboutScreen.jsx (about screen. shows the app's name, instructions on how to play, and a link to the privacy policy.)
 ┃   ┣─ navigation/
 ┃   ┃   ┣─ BottomTabNavigator.jsx (game, freinds search, me, freinds, log)
 ┃   ┃   ┣─ AppNavigator.jsx
 ┃   ┃   ┗─ ...
 ┃   ┣─ services/
 ┃   ┃   ┣─ firebase.js      # Config & shared logic for Firebase
 ┃   ┃   ┣─ socket.js        # Setup Socket.IO client
 ┃   ┃   ┣─ api.js           # Functions to fetch from external geo APIs
 ┃   ┃   ┗─ ...
 ┃   ┣─ utils/
 ┃   ┃   ┣─ constants.js
 ┃   ┃   ┣─ countryHelpers.js # Helper for country name validation
 ┃   ┃   ┗─ ...
 ┃   ┣─ contexts/
 ┃   ┃   ┗─ AuthContext.js
 ┃   ┗─ App.js
 ┣─ functions/               # If using Firebase Cloud Functions
 ┣─ .env                     # Environment variables
 ┣─ package.json
 ┗─ README.md
```

---

## 4. Environment Setup

1. **Install Expo CLI**  
   ```bash
   npm install -g expo-cli
   ```
2. **Clone the repository & install deps**  
   ```bash
   git clone git@github.com:Rafibarides/worldly.git worldly
   cd worldly
   npm install
   ```
3. **Firebase Project Setup**  
   - Create a Firebase project in the console.  
   - Enable **Authentication** (Email/Password, Google, etc.).  
   - Enable **Firestore** in test mode initially.  
   - (Optional) Enable **Storage** if storing custom profile images in Firebase.  
   - Download `google-services.json` (Android) and `GoogleService-Info.plist` (iOS) if you do a standard RN config.  
   - For pure Expo: use `expo-firebase-core` or manually set your Firebase config in `firebase.js`.
4. **Create .env**  
   Store environment variables like:  
   ```
   FIREBASE_API_KEY=xxx
   FIREBASE_AUTH_DOMAIN=xxx
   ...
   GEO_API_KEY=xxx
   ```
5. **Run the app**  
   ```bash
   expo start
   ```

---

## 5. Firebase Configuration & Authentication

1. **Install Dependencies**  
   ```bash
   npm install firebase firebaseui react-native-firebaseui --save
   ```
   Or for pure Expo, you might rely on `expo-firebase-core` or official Firebase JS SDK.

2. **Initialize Firebase** (`services/firebase.js`)
   ```js
   import { initializeApp } from 'firebase/app';
   import { getAuth } from 'firebase/auth';
   import { getFirestore } from 'firebase/firestore';

   const firebaseConfig = {
     apiKey: process.env.FIREBASE_API_KEY,
     authDomain: process.env.FIREBASE_AUTH_DOMAIN,
     projectId: process.env.FIREBASE_PROJECT_ID,
     // ...
   };

   const app = initializeApp(firebaseConfig);
   export const auth = getAuth(app);
   export const db = getFirestore(app);
   ```
3. **Use FirebaseUI**  
   - For iOS-specific setup, add in `Podfile`:
     ```ruby
     pod 'FirebaseUI/Auth'
     pod 'FirebaseUI/Google'
     pod 'FirebaseUI/Phone'
     ```
   - Configure sign-in flows for email/password, Google, phone, etc. Developer can decide how to embed the UI or replicate it with custom screens if that’s easier in React Native.

---

## 6. Real-Time Multiplayer (Socket.IO)

1. **Server Setup**  
   - A Node.js server with `socket.io` installed.  
   - Alternatively, a Cloud Run or similar serverless container if you want to avoid dedicated hosting.  
   - Example minimal server:
     ```js
     const express = require('express');
     const http = require('http');
     const socketIo = require('socket.io');

     const app = express();
     const server = http.createServer(app);
     const io = socketIo(server, { cors: { origin: "*" } });

     io.on('connection', (socket) => {
       console.log('New client connected:', socket.id);

       socket.on('joinGame', (gameId, userId) => {
         socket.join(gameId);
         // Notify others that user joined
         io.to(gameId).emit('playerJoined', { userId });
       });

       socket.on('countryGuessed', (gameId, { userId, country }) => {
         // Validate guess & update state in DB
         io.to(gameId).emit('countryGuessedUpdate', { userId, country });
       });

       socket.on('disconnect', () => {
         console.log('Client disconnected:', socket.id);
       });
     });

     server.listen(3000, () => {
       console.log('Socket server running on port 3000');
     });
     ```
2. **Client Setup** (`services/socket.js`)
   ```js
   import io from 'socket.io-client';

   const socket = io('https://<YOUR-SERVER-URL>', {
     transports: ['websocket'],
   });

   export default socket;
   ```
3. **Real-Time Flow**  
   - **joinGame** event: When a user accepts a challenge or starts a match.  
   - **countryGuessed** event: Fired every time the user inputs a correct country. Server broadcasts the update to all players in the room (`gameId`).  
   - End game condition: If a user hits 196 countries or 11 minute timer runs out, server emits a `gameOver` event with winner data.

---

## 7. Game Logic & Validation

### 7.1 Country Validation
- **Strategy:** Use a local list of 196 countries (JSON) + continent associations or call a REST API to confirm each guess.  
- If using an external API:
  ```js
  // Example with Axios. we are not using axios, we are using fetch. this is just an example.
  import axios from 'axios';

  export async function validateCountryName(input) {
    // Normalize input (trim, toLowerCase, etc.)
    const response = await axios.get(`https://my-geo-api/validate?name=${input}`);
    return response.data.isValid;
  }
  ```
- Keep a local copy of all countries in Firestore or in memory for quick lookups to reduce external calls.

### 7.2 Gameplay Flow
1. **User enters country name** in a text input. the dont need to press a button, or hit enter, they can just type the name of the country, in which case the country will be validated and the input will be cleared.
2. **Check** if that country is valid (via local or external check).  
3. **If valid** and not previously guessed by that user: increment that user’s `countriesGuessed` count, mark the country as green for them. If valid but already guessed, the text simply won't change/get cleared. A little animation could be added to indicate that the country is being validated.
4. **Broadcast** to opponent: color that country in blue on the opponent’s map.  
5. **Check** if the user now has 196 countries. If yes, game ends, declare them the winner.  
6. **Track** all guesses in Firestore for stats & achievements.

### 7.3 Timer
- An 11-minute timer should be displayed on the UI. Use a combination of local state + server confirmations to avoid cheating.  
- If time hits zero, compare `countriesGuessed` for each player. Highest wins. If tie, show tie screen.

### 7.4 Exiting & Rejoining a Game (multiplayer only)

The **Gameplay Page** includes an **Exit Button**, allowing players to leave a game at any time in multiplayer mode. However, exiting does **not** end the game or forfeit the match (the game will continue in the background, and the player can rejoin at any time).  

#### **How It Works:**  
- **Leaving the game** simply takes the player back to the **Game Page**, while the game itself continues in the background.  
- The player can **rejoin at any time**, picking up **exactly where they left off**, with the same progress and remaining time.  
- Since the game clock keeps running, exiting results in **lost time**, creating a natural disadvantage but no penalty beyond that.  

This system ensures that players can step away if needed while keeping the game **fair and uninterrupted** for both solo and multiplayer modes.

(### **Handling Exiting & Rejoining with Socket.IO**  

In a **Socket.IO**-powered multiplayer game, a player's exit should not disrupt the session, but their absence needs to be accounted for. Below is how this behavior can be implemented effectively.

#### **1. Player Exits Mid-Game**  
- When a player **clicks the exit button**, emit an event like `"player-left"` to inform the server.  
- The game instance remains active, and the player’s data (score, progress, remaining time) is **not deleted**.  
- Other players in the game remain unaffected, and the game continues.  

#### **2. Rejoining the Game**  
- When the player **returns to the game page**, they automatically attempt to reconnect via **Socket.IO**.
- Emit a `"rejoin-game"` event to request the last game state from the server.  
- The server sends back the stored progress (e.g., `"resume-game"` event), allowing the client to **restore the game exactly where they left off**.  

#### **3. Time Continues to Run**  
- Since the server keeps track of the **game timer**, the time lost while the player was absent **cannot be recovered**.  
- The remaining time upon rejoining is simply **whatever is left on the game clock** when they reconnect.  

#### **4. Edge Cases & Considerations**  
- If the player disconnects **due to network issues**, they should be able to reconnect automatically using their **Socket.IO session ID**.  
- In multiplayer, an opponent might see a **"Waiting for player to reconnect…"** message to indicate that the player left but can return.  
- If the game mode is **solo**, exiting ends the game.  

This approach ensures a **smooth** and **fair** experience, allowing players to exit when needed while preserving game continuity.)
---

## 8. Data Model (ERD Recap)

Below is a quick reference to your DB schema. In production, we’ll store this primarily in **Firestore** collections. The SQL-like structure can guide the developer in naming. For example:

- **Firestore Collections**:
  - `users`  
  - `friendships`  
  - `challenges`  
  - `games`  
  - `game_participants`  
  - `game_countries` (optional; can be merged with sub-collections in `games`)  
  - `badges`  
  - `user_badges`  
  - `notifications`  

Use Firestore subcollections (e.g., `games/{gameId}/participants`) if that’s more convenient. The developer can adapt to typical Firestore design patterns:

1. **users**  
   - Fields: `email, username, profilePicture, phoneNumber, createdAt, ...`

2. **friendships**  
   - Could also be stored as sub-docs under each user, e.g., `users/{uid}/friends/{friendUid}`.

3. **challenges**  
   - `challengerId, challengedId, status (pending, accepted, canceled, missed)`

4. **games**  
   - `gameType (solo/multiplayer), status (ongoing/completed), winnerId, startTime, endTime`

5. **game_participants**  
   - `userId, gameId, countriesGuessed, ...`

6. **badges**  
   - Master data for badges: { name, continent, description }

7. **user_badges**  
   - Link user + badge; track `timesCompleted`.

---

## 9. Features & Screens

Below is a reference to each screen and the major features / API calls needed.

1. **Sign Up Page**  
   - Input fields: email, username, password, phone number (optional).  
   - Option: “Sign in with Google”.  
   - On success: create user doc in Firestore => navigate to Home.

2. **Login Page**  
   - Email/Password or “Sign in with Google” using FirebaseUI.

3. **Home Dashboard (User Profile)**  
   - Displays user’s name, profile picture, badge icons.  
   - Quick stats: total countries guessed, highest streak, etc.  
   - “Challenge Button” to pick a friend and start a game.  

4. **Friends List Page**  
   - Show current friends + “Add Friend” option.  
   - When picking a friend, you can view their profile or “Challenge” them.  

5. **Friend Profile Page**  
   - Shows friend’s badges, stats, possibly latest games.  

6. **Friend Search Page**  
   - Input username, search across `users` in Firestore.  
   - Option to add or remove friends.

7. **Challenge Pending Room**  
   - Waits for the other user to accept.  
   - Cancel if they don’t join.

8. **Missed Challenges Log**  
   - List of missed invites (status = “missed”).  
   - Option to reissue a challenge.

9. **Game Play Screen**  
   - Interactive empty world map (render via RN Maps or Mapbox).  
   - Text input to guess countries.  
   - Real-time counters for both players.  
   - 11-minute countdown.  
   - Green = your countries; Blue = opponent’s countries.  

10. **Winner / Loser / Tie**  
   - Shown at game end. Displays final counts + “Play Again” button.

11. **Game Summary Page**  
   - Detailed breakdown: Countries guessed, missed, correct, time used, etc.

12. **Badges & Achievements Page**  
   - Displays each continent badge + progress tracker (# of times continent completed).  
   - Shows the World Master Badge if earned.

13. **Profile Settings Page**  
   - Update profile picture, password, or toggle contact sync.

14. **Sync Contacts Page**  
   - Requires permission to read phone contacts.  
   - Matches phone numbers with existing users in Firestore => “Suggested Friends” list.

15. **Notifications Center Page**  
   - Summaries of friend requests, missed challenges, etc.

16. **About & How to Play Page**  
   - Brief instructions + credit.

---

## 10. Badges & Achievements

1. **Tracking**  
   - Each time a user completes a continent (names all countries in that continent during a game), increment a counter in `user_badges`.  
   - If the user hits 3 completions for that continent, mark the badge as earned.  
   - Do the same for all 196 countries for the “World Master Badge”.  
   - For now, the badges can be displayed as just text on the screen. (later we can add images)

2. **Implementation Outline**  
   - On game end, run a function to evaluate which continents were fully guessed.  
   - Update Firestore doc(s) for that user’s achievement counters.  
   - If a user completes a new badge, set `earnedDate` to `Timestamp.now()`.

---

## 11. Contact Sync Flow

1. **Enable Permission**  
   - Use `Expo.Contacts.requestPermissionsAsync()` to get user permission.  

2. **Fetch Contacts**  
   ```js
   import * as Contacts from 'expo-contacts';

   async function syncContacts() {
     const { data } = await Contacts.getContactsAsync({ fields: [Contacts.Fields.PhoneNumbers] });
     if (data.length > 0) {
       // Extract phone numbers
       const phoneNumbers = data.map(c => c.phoneNumbers?.[0]?.number).filter(Boolean);
       // Clean/normalize phone numbers, then query Firestore for matches
     }
   }
   ```
3. **Find Matches**  
   - For each normalized phone number, check if there’s a user doc with that phone.  
   - Display results in “Suggested Friends”.

4. **Add Friend**  
   - Tapping “Add Friend” creates a `friendships` doc in Firestore with `status = 'pending'` or auto-accept if you want immediate friendship.

---

## 12. Notifications

- Use **Firebase Cloud Messaging** or **Expo Push** for offline notifications about challenges.  
- *Simplified approach:*  
  1. Store the user’s push token in Firestore.  
  2. When user A challenges user B (who is offline), trigger a Cloud Function to send a push notification to user B.  
  3. On mobile device, show a local alert.

---

## 13. Deployment & Submission

### 13.1 iOS (App Store)
1. **Build with EAS**  
   ```bash
   eas build -p ios --profile production
   ```
2. **Test** on TestFlight.  
3. **Submit** with `eas submit` or manually upload the IPA via Transporter to App Store Connect.

### 13.2 Android (Play Store)
1. **Build with EAS**  
   ```bash
   eas build -p android --profile production
   ```
2. **Upload** the `.aab` to the Google Play Console.  
3. Set up internal testing track, then promote to production.

---

## 14. Game Page
When navigated to, this page:

- Displays a "Challenge" button(when clicked, it offers the user the ability to either challenge a friend or start a solo game).
- Shows incoming challenges with the challenger’s name and a "Join" button.
- Allows you to start a solo game (11-minute timer, score at the end).
- Lets you challenge a friend in multiplayer mode.
- Navigates to a pending room while waiting for the opponent.

Page Overview  

The **Game Page** serves as the central hub for initiating and accepting challenges in the geography game. Upon navigating to this page, players are presented with various options for engaging in solo or multiplayer gameplay.

#### **Main Elements**  
1. **Challenge Button (Primary Call-to-Action)**  
   - A prominently displayed **"Challenge"** button allows the player to initiate a new game session.  

2. **Incoming Challenge Notification (If Applicable)**  
   - If another player has challenged the user, a notification will appear on this page.  
   - The notification includes the **challenger's name** and a **"Join"** button.  
   - Clicking **"Join"** redirects the user to a **Pending Room**, where they wait for the game to start.  

---

### **Challenge Options**  
Upon clicking the **"Challenge"** button, the user selects between two gameplay modes:

1. **Solo Mode**  
   - The player competes alone with an **11-minute timer** to identify as many countries as possible.  
   - Once the timer runs out, the game ends, and a **final score** is displayed.  
   - No additional interactions are required after the game concludes.

2. **Multiplayer Mode**  
   - The player selects an opponent from a **list of friends**.  
   - Sending a challenge redirects the user to a **Pending Room**, where they wait for their friend to join.  
   - Once both players have entered the Pending Room, the **challenger clicks "Start Game"** to begin.  

The Gameplay Page must ensure a smooth transition from challenge initiation to game start, whether playing solo or against friends.

## 14.1 Pending Room Page

The **Pending Room** page is a crucial component of the multiplayer gameplay experience. It facilitates the waiting period between a user sending a challenge and their opponent accepting it.

## 14.2 Navigation Bar

### **Bottom Navigation Bar Overview**  

The **Bottom Navigation Bar** provides seamless access to the core sections of the app. It remains persistently visible at the bottom of the screen (unless a game is in progress), allowing users to navigate between key pages efficiently.

#### **Navigation Items & Behavior**  
The navigation bar consists of four primary icons, each leading to a different section:

1. **Game (🎮)**
   - Takes the user to the **Gameplay Page**, where they can initiate a challenge, accept incoming challenges, and start solo or multiplayer games.  
   - Once a game begins, this is also where the actual **gameplay occurs**.  

2. **Friends Search (🔍)**
   - Opens the **Friends Search Page**, allowing users to search for friends by **username** and send friend requests.  
   - Provides a simple input field for searching and a list of results.  
   - Users can view friend profiles and initiate challenges from here.  

3. **Me (🏠)**
   - Serves as the **user’s profile/home page**, displaying:  
     - The **user’s badges** earned through gameplay.  
     - **Profile picture** and basic account details.  
     - A **Settings button** for managing account preferences.  

4. **Friends (👬)**
   - Displays a list of the user's friends.
   - Allows the user to remove friends from their friends list.
   - Allows the user to view their friends' profiles.
   - Allows the user to challenge their friends to a game.

5. **Log (📜)**
   - Displays a **history of past challenges**, both completed and pending.  
   - Shows results of previous games, including scores and challenge details.  
   - Allows users to revisit previous matchups and track their progress over time.  

Each tab updates dynamically based on the user’s activity, ensuring a smooth and intuitive navigation experience throughout the app. The **Bottom Navigation Bar** is persistent across most pages, providing quick access to key sections of the app. However, to ensure an optimal gameplay experience, it dynamically adjusts its visibility based on the user's activity.  

#### **Auto-Hiding During Gameplay**  
- When a game **begins**, whether in **solo mode or multiplayer**, the navigation bar **automatically disappears** to prevent interference with the gameplay interface.  
- This ensures the user has an **uninterrupted** and **full-screen experience**, preventing accidental taps on navigation buttons.  

#### **Reappearing After Gameplay**  
- Once the game **ends**, whether due to the timer running out (solo mode) or the match concluding (multiplayer mode), the navigation bar **reappears automatically**, allowing the player to navigate freely again.  

This behavior maintains a **clean, distraction-free** game interface while preserving easy navigation before and after gameplay.

client/assets/images:
1. **logs.png**: Icon for "Missed Challenges" in the navbar.
2. **magnifying-glass.png**: Icon for "Search" (friends search) functionality.
3. **home.png**: Icon for the "Current User Profile/Dashboard."
4. **friends.png**: Icon for the "Friends" tab.
5. **globe.png**: Icon for "Gameplay" in the navbar. 


---

## 15. Summary

- **Frontend:** React Native with Expo for cross-platform dev.  
- **Backend:** Firebase for auth/storage + Node/Socket.IO for real-time.  
- **Core Data:** Firestore for game states, user data, badges, challenges.  
- **Game Flow:** 2 modes (solo & multiplayer), 11-minute timer, real-time updates for country guesses.  
- **Achievements:** Continent-based badges + World Master Badge.  
- **Notifications:** Cloud Functions + FCM or Expo Push.  
- **Deployment:** EAS for both iOS and Android.

---


**styling**

## colors

we will use the following colors in addition to black and white:
/* Color Theme Swatches in RGBA */
.Abstract-pink-and-green-watercolor-brush-stroke.-1-rgba { color: rgba(242, 205, 215, 1); }
.Abstract-pink-and-green-watercolor-brush-stroke.-2-rgba { color: rgba(242, 174, 199, 1); }
.Abstract-pink-and-green-watercolor-brush-stroke.-3-rgba { color: rgba(177, 216, 138, 1); }
.Abstract-pink-and-green-watercolor-brush-stroke.-4-rgba { color: rgba(197, 216, 156, 1); }
.Abstract-pink-and-green-watercolor-brush-stroke.-5-rgba { color: rgba(207, 216, 175, 1); }


## fonts


This UI styling has a clean and playful aesthetic with the following notable characteristics:

1. **Color Scheme**:
   - Vibrant, pastel colors. 
   - The colors are soft and inviting, suitable for a fun or casual app, likely aimed at younger audiences or lighthearted use cases.

2. **Typography**:
   - Clear, rounded sans-serif fonts are used, ensuring readability.
   - Text is minimal, concise, and well-spaced, giving prominence to the visuals.

4. **Buttons**:
   - Rounded, pill-shaped buttons are consistently used (e.g., "Play Now," "Add Favorite"). 
   - The buttons stand out with subtle contrast against the background while maintaining simplicity.

5. **Card Layout**:
   - Each section (character details, weapon selection) is designed with a card-like layout that has subtle shadows and rounded corners, contributing to a polished and modern look.

6. **Navigation**:
   - A simple bottom navigation bar is included for switching between sections, with icons clearly aligned and labeled.

7. **Overall Style**:
   - A smooth, minimalistic design with ample padding, clean alignment, and no clutter. It emphasizes user-friendly interaction and visually appealing design.

This UI is perfect for a fun, interactive app (e.g., game companion or character selection screen) and leverages modern design principles.

**Map Implementations**

client/src/utils/Country_Names.json is the file that contains the country names that are used in the game, that the GeoJSON file is mapped to, and therefore expecting.


**That’s the full technical roadmap.** Hand this document to the dev team for a clear blueprint of how to implement and launch Worldly. 