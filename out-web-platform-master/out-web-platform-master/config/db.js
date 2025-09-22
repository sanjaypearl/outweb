 

import "reflect-metadata";
import {
  DataSource
} from "typeorm";
import {
  User
} from "../model/usertable.js";
import {
  AgreementForm
} from "../model/FormTable.js"
import {
  UserFormResponse
} from "../model/userform_response_table.js"
import dotenv from "dotenv"

dotenv.config()



export const AppDataSource = new DataSource({
  type: "oracle",
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  connectString: process.env.DB_CONNECT_STRING,
  synchronize: true,
  logging: true,
  entities: [User, AgreementForm, UserFormResponse ],
  migrationsRun: true,

});