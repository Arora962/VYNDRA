# 🍽️ VYNDRA

**Chat with friends. Snap your food. Know what you eat.**

VYNDRA is a cross-platform mobile app (React Native + TypeScript) that combines **social chat**, **food-image recognition** and **nutrition analytics**. It detects when you talk about food in a conversation, nudges you to share a photo of the meal, identifies the dish, estimates calories and macros, and turns your logs into weekly insights. It also analyses the chat network to show influencers and communities.

> Built as an applied project for **CBS3009 – Advanced Social, Text and Media Analytics**, integrating text analytics (food-intent detection), media analytics (dish recognition), and social network analysis (influence and communities) in one product.

---

## ✨ Features

| Area | What it does |
|---|---|
| **Profiles** | Pick or create a user with an optional diet (Vegetarian, Vegan, Keto, Pescatarian, Mediterranean, Paleo) and allergens (Dairy, Eggs, Gluten, Nuts, Seafood, Soy). |
| **Today (Home)** | Daily calorie ring against a 2000 kcal goal, macro split (protein / carbs / fat / fiber), and recent meals. Pull to refresh. |
| **Scan a meal** | Take a photo or pick one from the gallery, choose servings (0.5×–2×), and get detected foods, grams, confidence, calories and macros. |
| **Low-confidence handling** | Warns when the model is unsure. If a dish has no nutrition data, you can pick the closest food from suggestions and the totals update. |
| **Chat** | Group chat ("VYNDRA Lounge") and 1-to-1 DMs, refreshed every 4 seconds. |
| **Food-intent nudge** | The backend classifies each message. Food mentions show a 🍽 *food intent* badge with probability and a pulsing "📸 Snap it!" card that opens the camera. |
| **Meals in chat** | Photos sent in a chat appear as bubbles with their nutrition analysis attached. |
| **Insights** | 7-day calorie bar chart with goal line, weekly totals and average per day, macro split, **diet-fit score**, and **allergen warnings**. |
| **Explore → Influencers** | Users ranked by influence in the message/reply/reaction network (PageRank and centrality metrics). |
| **Explore → Communities** | Louvain community detection with group sizes and modularity. Your own group is highlighted. |
| **Explore → Foods** | Search any food (debounced) to see its food cluster, diet tags, allergens, best time to eat and healthier swaps with % calorie savings. |
| **Server settings** | Change the backend URL inside the app and test the connection, with no code change needed. |

---

## 🏗️ Architecture

```
┌─────────────────────────┐        HTTP / JSON         ┌──────────────────────────────┐
│  VYNDRA mobile app      │  ───────────────────────►  │  VYNDRA backend (Flask)      │
│  React Native + TS      │  ◄───────────────────────  │  (separate repo/folder)      │
│  (this repository)      │   multipart for images     │  intent model, dish          │
└─────────────────────────┘                            │  classifier, nutrition table,│
                                                       │  social graph analytics      │
                                                       └──────────────────────────────┘
```

**Pipeline:** Chat text / meal photo → intent detection & dish recognition → nutrition lookup (per 100 g) → aggregation → visual insights → social network analysis.

### Project structure

```
VYNDRA/
├── App.tsx                  # Root: tab bar, overlays (chat / scan), Android back handling
├── index.js                 # App entry point
├── src/
│   ├── api.ts               # All backend calls + response normalisers + base-URL config
│   ├── types.ts             # Shared TypeScript types
│   ├── theme.ts             # Colours, spacing, daily calorie goal
│   ├── utils.ts             # Date/time helpers, chat room ids
│   ├── components/
│   │   ├── ui.tsx           # Card, Button, Chip, TickRing, BarChart, MacroRow, ...
│   │   └── MealCard.tsx     # Compact meal analysis card
│   └── screens/
│       ├── ProfileScreen.tsx   # Pick/create user, server settings
│       ├── HomeScreen.tsx      # Daily summary + recent meals
│       ├── ScanScreen.tsx      # Camera/gallery, analysis, manual correction
│       ├── ChatListScreen.tsx  # Lounge + friends
│       ├── ChatScreen.tsx      # Messages, nudge, photo sharing
│       ├── InsightsScreen.tsx  # Weekly charts, diet fit, allergens
│       └── ExploreScreen.tsx   # Influencers, communities, food search
├── __tests__/App.test.tsx   # Jest smoke test (mocked network)
├── android/  ios/           # Native projects
```

> `CaptureScreen.tsx` and `SummaryScreen.tsx` are older screens that are no longer used by `App.tsx`.

---

## 🔌 Backend API used by the app

The app expects a Flask server (default port **5001**). `api.ts` normalises loosely-shaped responses so small backend changes don't crash screens.

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Connection test |
| GET / POST | `/api/users` | List / create profiles |
| POST | `/api/chat/send` | Send text; returns `nudge`, `nudge_text`, food mention |
| POST | `/api/chat/send-meal` | Send a meal photo (multipart) into a chat |
| GET | `/api/chat/<conversation_id>` | Fetch messages |
| POST | `/api/meals/analyze` | Analyse a photo (`image`, `user_id`, `servings`) |
| GET | `/api/meals?limit=50&user_id=` | Meal history |
| GET | `/api/insights/<user_id>` | Daily/weekly totals, diet fit, allergen warnings |
| GET | `/api/social/influencers` | Influence ranking |
| GET | `/api/social/communities` | Communities + modularity |
| GET | `/api/foods/search?q=` | Food search |
| GET | `/api/foods/<name>/insights` | Cluster, diets, allergens, swaps |
| POST | `/api/nutrition/calculate` | Nutrition for a chosen food and grams |

---

## 🚀 Getting Started

### Prerequisites
- Node.js **≥ 22.11**
- React Native environment ([setup guide](https://reactnative.dev/docs/set-up-your-environment)): Android Studio and/or Xcode + CocoaPods
- The VYNDRA backend running on your machine
- Phone/emulator on the **same Wi-Fi** as the backend

### 1. Install
```bash
git clone <your-repo-url>
cd VYNDRA
npm install
# iOS only
bundle install && cd ios && bundle exec pod install && cd ..
```

### 2. Start the backend
```bash
VYNDRA_HOST=0.0.0.0 python app.py     # listens on port 5001
```
For the social tabs, generate network data on the backend first with `scripts/make_social_data.py`.

### 3. Point the app to your backend
Use your computer's **LAN IP**, never `localhost`. Either:
- edit `BASE_URL` in `src/api.ts`, **or**
- open the app → **Profile screen → ⚙️ Server settings** → enter e.g. `http://192.168.1.5:5001` → **Save & test**.

### 4. Run
```bash
npm start            # Metro bundler
npm run android      # Android
npm run ios          # iOS
```

### Other scripts
```bash
npm test             # Jest
npm run lint         # ESLint
```

---

## 📱 How to use

1. **Choose or create a profile** (add diet and allergens for personalised insights).
2. **Chat** in the Lounge or a DM, e.g. *"I just had biryani for lunch 😋"*. VYNDRA detects the food intent and nudges you.
3. **Snap the meal** (📸 button in the tab bar, chat, or nudge). Pick servings and tap **Analyse meal**.
4. **Review the result**: calories, macros and confidence. Correct unknown dishes using the suggested foods.
5. Check **Today** and **Insights** for progress, diet fit and allergen alerts.
6. Open **Explore** to see influencers, communities, and healthier food swaps.

---

## 🔐 Permissions & privacy

- **Camera** and **photo library** access are used only to capture or select meal photos.
- **Internet** access is required to reach your backend.
- The app uses plain HTTP to a local server for development. Use HTTPS in production.
- Nutrition estimates, diet tags and allergen warnings are rule/dataset-based **guidance only, not medical advice**.

---

## 🧰 Tech Stack

React Native 0.87 · React 19 · TypeScript · `react-native-image-picker` · `react-native-safe-area-context` · Jest · ESLint · Prettier

---

## ⚠️ Known Limitations

- Requires the companion backend and a shared network. The app does not work standalone.
- Dish recognition is limited to the classes the backend model was trained on; unknown dishes need manual selection.
- Chat uses polling (every 4 s) rather than WebSockets.
- The 2000 kcal daily goal is fixed in `src/theme.ts`.
- Profile selection has no authentication (demo-style login).

## 🔮 Future Work

User authentication, personalised calorie goals, WebSocket chat, portion estimation from images, offline caching, and HTTPS deployment.

---

## 📄 License & Acknowledgements

Add your license here. Please credit datasets, pretrained models and libraries used by the backend (food-image dataset, nutrition table, diet-mapping CSV).