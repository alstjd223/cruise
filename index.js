const express = require('express');
const mqtt = require('mqtt');
const client = mqtt.connect('mqtt://broker.emqx.io:1883');
const { sequelize, User, Cardkey } = require('./db');

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

client.on('message', async (topic, message) => {
    let messageStr = message.toString();

    if (topic === RFID_TOPIC) {
        let cardnum = messageStr.replace(/\s+/g, '');
        const doorid = cardnum[0];
        cardnum = cardnum.slice(1);

        try {
            const card = await Cardkey.findOne({
                where: { cardnum },
                include: User
            });

            console.log('Card:', card);

            if (card && card.User) {
                exists = card.User.doorpermission;
            } else {
                exists = 0;
            }

            client.publish(RESPONSE_TOPIC, exists.toString(), (err) => {
                if (err) {
                    console.error('MQTT publish error', err);
                } else {
                    console.log(`Sent response: ${exists} for cardnum: ${cardnum}`);
                }
            });
        } catch (err) {
            console.error('Database query error', err);
        }
    }
});


app.get('/permission', (req, res) => {
    if (exists === 1) {
        client.publish(RESPONSE_TOPIC, '1', (err) => {
            if (err) {
                console.error('MQTT publish error', err);
            }
        });
        res.status(200).send('문이 열렸습니다.');
    } else {
        client.publish(RESPONSE_TOPIC, '0', (err) => {
            if (err) {
                console.error('MQTT publish error', err);
            }
        });
        res.status(403).send('권한이 없습니다.');
    }
});

app.listen(4000, () => {
    console.log('Server running on port 4000');
});


client.on('error', (err) => {
    console.error('MQTT connection error:', err);
});