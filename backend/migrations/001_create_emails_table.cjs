// migrations/001_create_emails_table.cjs
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.schema.createTable('emails', function(table) {
    table.string('id').primary();
    table.string('to').notNullable();
    table.string('cc');
    table.string('bcc');
    table.string('subject').notNullable();
    table.text('body').notNullable();
    table.string('type'); // 'sales', 'followup', 'general'
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.dropTable('emails');
};