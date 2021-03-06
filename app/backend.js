/// <reference path="../typings/pg/pg.d.ts"/>
var pg = require('pg.js');
module.exports = function createTodoBackend(connectionString) {
    function query(query, params, callback) {
        pg.connect(connectionString, function (err, client, done) {
            done();
            if (err) {
                console.error(err);
                callback(err, null);
                return;
            }
            client.query(query, params, function (err, result) {
                if (err) {
                    console.error(err);
                    callback(err, null);
                    return;
                }
                callback(null, result.rows);
            });
        });
    }
    return {
        all: function (callback) {
            query('SELECT * FROM todos', [], function (err, todos) { return callback(err, todos); });
        },
        get: function (id, callback) {
            query('SELECT * FROM todos WHERE id = $1', [id], function (err, todos) { return callback(err, todos && todos[0]); });
        },
        create: function (title, order, callback) {
            query('INSERT INTO todos ("title", "order", "completed") VALUES ($1, $2, false) RETURNING *', [title, order], function (err, todos) { return callback(err, todos && todos[0]); });
        },
        update: function (id, properties, callback) {
            var assigns = [];
            var values = [];
            if ('title' in properties) {
                assigns.push('"title"=$' + (assigns.length + 1));
                values.push(properties.title);
            }
            if ('order' in properties) {
                assigns.push('"order"=$' + (assigns.length + 1));
                values.push(properties.order);
            }
            if ('completed' in properties) {
                assigns.push('"completed"=$' + (assigns.length + 1));
                values.push(properties.completed);
            }
            var updateQuery = [
                'UPDATE todos',
                'SET ' + assigns.join(', '),
                'WHERE id = $' + (assigns.length + 1),
                'RETURNING *'
            ];
            query(updateQuery.join(' '), values.concat([id]), function (err, rows) {
                callback(err, rows && rows[0]);
            });
        },
        delete: function (id, callback) {
            query('DELETE FROM todos WHERE id = $1 RETURNING *', [id], function (err, rows) {
                callback(err, rows && rows[0]);
            });
        },
        clear: function (callback) {
            query('DELETE FROM todos RETURNING *', [], callback);
        }
    };
};
