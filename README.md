# Blog Application (Server / Backend)

The frontend of this application can be found here: [Client Repo](https://github.com/JohnnyParra/BVTCA-Final-Project-Client)

## Getting Started
1. Clone both the Client and Server repositories into a single folder

2. Install all the dependecies for both repos with the following commmand: <br>
     -This step will need to be completed twice, once while in the Client directory and another in the Server directory
```
npm i
```

3. Import the database dump into mysql using the folder ExampleDB that is in this repo

4. Create a .env file in this repo that stores the following information:  <br>
DB_HOST      = //The name of the database host (ex. localhost)  
DB_USER      = //The name of the user (ex. root)  
DB_PASSWORD  = //The password you used to access your database  
DB_NAME      = //The name of the Schema (ex. blog_database)  
DB_PORT      = //The port your database is running on  
JWT_KEY      = //The key you want to use to sign the JWT  
PORT         = //The port you want the express backend to run on (ex. 3000)  
