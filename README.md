# MiloMemory - Memory Game

MiloMemory is a memory card matching game where users can upload their own images to create a custom game. The game is built using Node.js, Express, and TypeScript for the backend, and HTML, CSS, and JavaScript for the frontend. The game is fully responsive and works on both mobile and web devices.

The game was made using Majority of Github Copilot Agents, and with the idea to have a simple memory game to play with my new son

## Features

- Upload 2-10 custom images to create a memory game
- Automatic creation of card pairs for each image
- Card flipping and matching logic
- Game statistics tracking (moves and time)
- Game completion detection
- Ability to reset or start a new game
- Data persistence using Supabase for storage

## Project Structure

```
CHANGELOG.md
copilot-instructions.md
LICENSE
package.json
tsconfig.json
supabase-setup.sql
supabase-deployment.md
src/
	index.ts
	config/
		supabase.ts
	controllers/
		gameController.ts
	models/
		Card.ts
		Game.ts
	public/
		index.html
		css/
			styles.css
		images/
		js/
			game.js
	routes/
		gameRoutes.ts
	services/
		databaseService.ts
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- Supabase account (for persistence and deployment)

### Installation

1. Clone the repository:

```sh
$ git clone https://github.com/Pluttodk/MiloMemory.git
$ cd MiloMemory
```

2. Install the dependencies:

```sh
$ npm install
```

3. Set up your Supabase project:
   - Create a new Supabase project from the [Supabase dashboard](https://app.supabase.com)
   - Run the SQL commands from `supabase-setup.sql` in the SQL editor
   - Create a storage bucket named `game-images` with public access
   - Copy your Supabase URL and API key from Project Settings > API

4. Create a `.env` file in the root directory with your Supabase credentials:

```
SUPABASE_URL=https://[YOUR_SUPABASE_PROJECT_ID].supabase.co
SUPABASE_KEY=[YOUR_SUPABASE_API_KEY]
SUPABASE_PROJECT_NAME=MiloMemory
SUPABASE_DB_PASSWORD=MiloMia
PORT=3000
```

5. Build the TypeScript code:

```sh
$ npm run build
```

6. Start the server:

- For development mode with hot-reloading:

```sh
$ npm run dev
```

- For production mode:

```sh
$ npm start
```

7. Open your web browser and navigate to `http://localhost:3000` to play the game.

## Deployment

For detailed deployment instructions, please refer to the [Supabase Deployment Guide](supabase-deployment.md).

## Usage

1. Upload 2-10 images from your device to create a custom memory game.
2. Click the "Start Game" button to upload the images and initialize the game.
3. Click on cards to flip them and try to match pairs.
4. The game tracks your moves and time until you find all matching pairs.
5. After completing the game, you can play again with the same images or create a new game with different images.

## Contributing

Contributions are welcome! If you have any suggestions or improvements, please create an issue or submit a pull request.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.