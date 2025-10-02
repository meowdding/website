# meowdding site

# Contrib

If you have questions, join our [Discord](https://meowdd.ing/discord) and ping `@.kathund`

## Requirements for deving

### Git

1. Download the installer from [Git Website](https://git-scm.com/).
2. Run the installer and leave all the default settings.

### Node.js

1. Download the installer from [Node.js Website](https://nodejs.org/en/).
2. Run the installer and leave all the default settings.

### pnpm

1. Open a terminal
2. Run the following command:

```bash
npm install -g pnpm
```

## Setup

1. Clone the repository

```bash
git clone https://github.com/meowdding/website.git
```

2. Change directory to the project

```bash
cd website
```

3. Install the dependencies

```bash
pnpm install
```

## Running

### Tailwind

You can compile the tailwind using this command

```bash
pnpm tailwind
```

You can watch the tailwind and have it auto compile using this command

```bash
pnpm tailwind:watch
```

### Formatting

This project uses prettier as a formatter.

You can run prettier using this command

```bash
pnpm prettier
```

### Reloading Site

You can enable a live server with hot reloading by running the following command

```bash
pnpm dev
```
