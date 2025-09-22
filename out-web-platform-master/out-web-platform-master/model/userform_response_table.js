 
import {
  EntitySchema
} from "typeorm";

export const UserFormResponse = new EntitySchema({
  name: "UserFormResponse",
  tableName: "user_form_responses",
  columns: {
    id: {
      type: "int",
      primary: true,
      generated: true,
    },
    responses: {
      type: "clob",  
      nullable: false,
    },
    formStatus: {
      type: "varchar",
      length: 50,
      default: "pending",  
    },
    docusignStatus: {
      type: "varchar",
      length: 50,
      default: "not_started",  
    },
    status: {
      type: "varchar",
      length: 50,
      default: "active",  
    },
    createdAt: {
      type: "timestamp",
      createDate: true,
    },
    updatedAt: {
      type: "timestamp",
      updateDate: true,
    },
  },
  relations: {
    user: {
      target: "User",
      type: "many-to-one",
      joinColumn: {
        name: "user_id"
      },
      nullable: false,
      onDelete: "CASCADE",
    },
    form: {
      target: "Form",
      type: "many-to-one",
      joinColumn: {
        name: "form_id"
      },
      nullable: false,
      onDelete: "CASCADE",
    },
  },
});
