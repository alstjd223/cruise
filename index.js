const express = require('express');
const mqtt = require('mqtt');
const client = mqtt.connect('mqtt://mqtt-dashboard.com');
const db = require('./db');

const app = express();

const RFID_TOPIC = "rfid/scan";
const RESPONSE_TOPIC = "rfid/response";

let exists = 0;

client.on('connect', () => {
    client.subscribe([RFID_TOPIC], (err) => {
        if (!err) {
            console.log(`Subscribed to topic: ${RFID_TOPIC}`);
        } else {
            console.error('Subscription error');
        }
    });
});

client.on('message', (topic, message) => {
    let messageStr = message.toString();

    if (topic === RFID_TOPIC) {
        const cardnum = messageStr.replace(/\s+/g, '');

        db.query('SELECT u.doorpermission FROM cardkey c JOIN user u ON c.usercode = u.usercode WHERE c.cardnum = ?', [cardnum], (err, result) => {
            if (err) {
                console.error('Database query error');
                return;
            }

            exists = result.length > 0 ? result[0].doorpermission : 0;

            client.publish(RESPONSE_TOPIC, exists.toString(), (err) => {
                if (err) {
                    console.error('MQTT publish error', err);
                } else {
                    console.log(`Sent response: ${exists} for cardnum: ${cardnum}`);
                }
            });
        });
    }
});

app.get('/permission', (req, res) => {
    if (exists === 1) {
        res.status(200).send('문이 열렸습니다.');
    } else {
        res.status(403).send('권한이 없습니다.');
    }
});

app.listen(3000, () => {
    console.log('Server running on port 3000');
});
