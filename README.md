# Love Link Server

Welcome to the Love Link server repository! This project powers the backend of the Love Link website, providing APIs and services for user authentication, biodata management, and more.

## Live Link
You can access the live platform at [Love Link](https://love-link-client.vercel.app). Love Link is an online matrimony platform where people can choose their life partners.

[Server Site Live Link](https://love-link-server-nine.vercel.app)


## Technology Used

- Node.js
- Express.js
- MongoDB
- JWT (JSON Web Tokens)
- Middleware (Cors, Body Parser)

  
## Dependencies

- [Express](https://www.npmjs.com/package/express): Web framework for Node.js.
- [Cors](https://www.npmjs.com/package/cors): Node.js middleware for enabling CORS.
- [Body-Parser](https://www.npmjs.com/package/body-parser): Node.js body parsing middleware.
- [JWT](https://www.npmjs.com/package/jsonwebtoken): JSON Web Token implementation for authentication.
- [Axios](https://www.npmjs.com/package/axios): Promise-based HTTP client for Node.js and the browser.




## Getting Started

To get a local copy up and running, follow these simple steps.

### Installation

1. **Clone the repository:**
   ```sh
   git clone https://github.com/RashedulHaqueRasel1/Love-Link-Server.git

2. Navigate to the project directory:
   ```sh
   cd Love-Link-Server
   
3. Install all dependencies:
   ```sh
   npm install

4. Set up environment variables:
   ```sh
     MONGODB_URI=your_mongodb_uri
     JWT_SECRET=your_jwt_secret

5. Run the server:
   ```sh
      nodemon index.js
