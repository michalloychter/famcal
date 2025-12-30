# FamCal – Family Calendar & Task Manager
<<<<<<< HEAD
=======

FamCal is a modern family calendar and task management web application built with Angular and Express. It allows families to manage shared tasks, events, and schedules with color-coded task types, member-specific views, and a user-friendly interface.

## Features
- Add, edit, and delete tasks for each family member
- Task types: Meeting, Class, Shopping, Birthday, Doctor, Other (each with unique color)
- Daily and member-based calendar views
- User-friendly date/time formatting
- Responsive UI with Angular standalone components
- Express backend with JWT authentication and Firebase for data storage

## Tech Stack
- Angular 20
- Express.js
- Firebase
- JWT
- SCSS/CSS

## Getting Started
1. Clone the repository:
	```sh
	git clone https://github.com/YOUR_USERNAME/famcal.git
	cd famcal
	```
2. Install dependencies for both frontend and backend:
	```sh
	npm install
	cd server && npm install
	```
3. Start the frontend (Angular):
	```sh
	npm run start
	```
4. Start the backend (Express):
	```sh
	cd server
	npm start
	```
5. Open [http://localhost:4200](http://localhost:4200) in your browser.

## Important
- **Do not commit secrets or credentials!**
- Make sure your `.gitignore` includes:
  - `server/firebase-service-account.json`
  - `.env`
  - `node_modules/`

## License
MIT

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
>>>>>>> 007dadd (Save local changes before rebase)

FamCal is a modern family calendar and task management web application built with Angular and Express. It allows families to manage shared tasks, events, and schedules with color-coded task types, member-specific views, and a user-friendly interface.
