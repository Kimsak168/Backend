'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add seed commands here.
     *
     * Example:
     * await queryInterface.bulkInsert('People', [{
     *   name: 'John Doe',
     *   isBetaMember: false
     * }], {});
    */
    await queryInterface.bulkInsert(
      'Customers',
      [
      {
        firstName: 'Sok',
        lastName: 'Kimsak',
        phone: "012345678",
        password: "12345",
        username: "sokkimsak",
        email: "Kimsak88@example.com",
        createdAt: new Date(),
        updatedAt: new Date(),
        },
        {
        firstName: 'Kim',
        lastName: 'Tola',
        phone: "0123456789",
        password: "123456",
        username: "kimtola",
        email: "kimtola@example.com",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */

      await queryInterface.bulkDelete('Customers', null, {});
  }
};
