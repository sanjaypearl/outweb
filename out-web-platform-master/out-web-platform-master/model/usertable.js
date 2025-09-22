

import { EntitySchema } from "typeorm";

export const User = new EntitySchema({
  name: "User",                // entity name
  tableName: "users",          // DB table
  columns: {
    id: {
      type: "int",
      primary: true,
      generated: true,
    },
    name: { type: "varchar", length: 100, nullable: false },
    username: { type: "varchar", length: 150, unique: true, nullable: false },
    password: { type: "varchar", length: 255, nullable: false },
    role: { type: "varchar", length: 20, default: "USER" },
    is_active: { type: "int", default: 0 },
    created_at: { type: "timestamp", default: () => "CURRENT_TIMESTAMP" },
  },
  relations: {
    forms: {
      target: "Form",     // ✅ must match entity name, not table
      type: "many-to-many",
      joinTable: {
        name: "USER_FORMS",
        joinColumn: { name: "USER_ID", referencedColumnName: "id" },
        inverseJoinColumn: { name: "FORM_ID", referencedColumnName: "id" },
      },
      cascade: true,
    },
    responses: {
      target: "UserFormResponse",
      type: "one-to-many",
      inverseSide: "user",
    },
  },
});
