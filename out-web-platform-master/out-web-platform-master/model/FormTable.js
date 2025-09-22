// // // import { EntitySchema } from "typeorm";

// // // export const AgreementForm = new EntitySchema({
// // //   name: "Form",
// // //   tableName: "forms",
// // //   columns: {
// // //     id: {
// // //       type: "number",
// // //       primary: true,
// // //       generated: true,
// // //     },
// // //     data: {
// // //       type: "clob",
// // //       nullable: false,
// // //     },
// // //     createdAt: {
// // //       type: "timestamp",
// // //       createDate: true,
// // //     },
// // //     updatedAt: {
// // //       type: "timestamp",
// // //       updateDate: true,
// // //     },
// // //   },
// // //   relations: {
// // //     users: {
// // //       target: "User",
// // //       type: "many-to-many",
// // //       mappedBy: "forms",
// // //     },
// // //   },
// // // });

// // import { EntitySchema } from "typeorm";

// // export const AgreementForm = new EntitySchema({
// //   name: "Form",
// //   tableName: "forms",
// //   columns: {
// //     id: {
// //       type: "number",
// //       primary: true,
// //       generated: true,
// //     },
// //     data: {
// //       type: "clob", // Oracle-friendly for JSON/data
// //       nullable: false,
// //     },
// //     createdAt: {
// //       type: "timestamp",
// //       createDate: true,
// //     },
// //     updatedAt: {
// //       type: "timestamp",
// //       updateDate: true,
// //     },
// //   },
// //   relations: {
// //     users: {
// //       target: "User",
// //       type: "many-to-many",
// //       mappedBy: "forms", // must match property name in User
// //     },
// //     responses: {
// //       target: "UserFormResponse",
// //       type: "one-to-many",
// //       inverseSide: "form", // must match property in UserFormResponse
// //     },
// //   },
// // });

// import { EntitySchema } from "typeorm";

// export const AgreementForm = new EntitySchema({
//   name: "Form",
//   tableName: "FORMS", // use UPPERCASE for Oracle table names!
//   columns: {
//     id: {
//       type: Number,
//       primary: true,
//       generated: true,
//     },
//     data: {
//       type: "clob", // For Oracle JSON/clob data
//       nullable: false,
//     },
//     createdAt: {
//       type: "timestamp",
//       createDate: true,
//     },
//     updatedAt: {
//       type: "timestamp",
//       updateDate: true,
//     },
//   },
//   relations: {
//     users: {
//       target: "User", // Must match 'name' in User entity
//       type: "many-to-many",
//       joinTable: true, // must match property name in User
//     },
//     // responses: {
//     //   target: "UserFormResponse",
//     //   type: "one-to-many",
//     //   inverseSide: "form", // must match property in UserFormResponse
//     // },
//   },
// });

import { EntitySchema } from "typeorm";

export const AgreementForm = new EntitySchema({
  name: "Form",
  tableName: "forms",

  columns: {
    name: { type: "varchar2", length: 255, nullable: false }, // ✅ new name field
    id: { type: "int", primary: true, generated: true },
    data: { type: "clob", nullable: false },
    assignedUserId: { type: "int", nullable: true }, // ✅ added this column
    createdAt: { type: "timestamp", createDate: true },
    updatedAt: { type: "timestamp", updateDate: true },
  },
  relations: {
    users: {
      target: "User",
      type: "many-to-many",
      joinTable: true,
    },
    responses: {
      target: "UserFormResponse",
      type: "one-to-many",
      inverseSide: "form",
    },
  },
});
