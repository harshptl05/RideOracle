# HackUTD-2025

# Ride Oracle - Toyota Car Finder 

A modern, AI-powered car finder web application that helps users discover their perfect Toyota vehicle through an interactive quiz and personalized recommendations. 
## ✨ Features

### Core Functionality
- **Interactive 10-Question Quiz**: Comprehensive questionnaire covering vehicle preferences, usage, priorities, features, fuel type, passenger needs, budget, and driving style- 
  - Side-by-side vehicle comparison (up to 3 cars)
  - Finance/lease calculator with credit score-based APR
  - Sentiment analysis from real Toyota reviews
  - AI-powered inventory chatbot for assistance


###  AI Features
- **Inventory Chatbot**: Context-aware assistant trained on vehicle data
- **Compatibility Algorithm**: Deterministic scoring system (not LLM-based) for accurate matches
- **Sentiment Analysis**: Real review insights for each vehicle

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **AI Integration**: OpenRouter API (for chatbot)

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** or **yarn** package manager
- **Git** (for cloning the repository)

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone <your-repository-url>
```

### 2. Install Dependencies

```bash
npm install
```

or if you're using yarn:

```bash
yarn install
```

### 3. Set Up Environment Variables (Optional)

The project uses OpenRouter API for the chatbot. If you want to use your own API key:

1. Create a `.env.local` file in the root directory:

```bash
touch .env.local
```

2. Add your OpenRouter API key:

```env
NEXT_PUBLIC_OPENROUTER_API_KEY=your-api-key-here
```


### 4. Run the Development Server

```bash
npm run dev
```

or

```bash
yarn dev
```

The application will be available at **http://localhost:3000**


## 🎯 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint


- **Unique Variation**: Each vehicle gets a slightly different score based on its properties to ensure realistic distribution

### Quiz Flow

1. **Quiz Page** : 10 questions covering all preferences
2. **Analysis Page**: Visual breakdown of answers with:
   - Key preferences cards
   - Driving style circular indicators
   - Priority distribution bars
3. **Inventory Page** (`/inventory`): Personalized results sorted by compatibility

### Inventory Features

- **Filtering**: Price range slider, fuel type, body type
- **Sorting**: By compatibility score (highest first)
- **Compare**: Select up to 3 vehicles for side-by-side comparison
- **Calculator**: Finance/lease calculator with:
  - Credit score-based APR (from SSN placeholder)
  - Down payment input
- **Chatbot**: AI assistant for questions about vehicles



### API Key Issues

- Ensure your OpenRouter API key is valid
- Check that the key has sufficient credits
- Verify the key is correctly set in environment variables or component files


## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request


