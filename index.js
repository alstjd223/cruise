const express = require('express');
const mqtt = require('mqtt');
const client = mqtt.connect('mqtt://broker.emqx.io:1883');
const {
    sequelize,
    User,
    Cardkey
} = require('./db');

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
            //아래는 디비에서 카드키 찾는 로직
            const card = await Cardkey.findOne({
                where: {
                    cardnum 
                },
                include: User
            });

            console.log('Card:', card);
            //아래는 카드키 찾은걸 바탕으로 권한 찾는 로직
            if (card && card.User) {
                exists = card.User.doorpermission;
            } else {
                exists = 0;
            }
            //아래는 권한 여부 판단
            if (exists === 1) {
                client.publish(RESPONSE_TOPIC, '1', (err) => {
                    if (err) {
                        console.error('MQTT publish error', err);
                    }
                }); //권한이 1이면 해당 토픽으로 1이라는 데이터를 쏴줌

                if (card) {
                    const usercode = card.usercode;
                    const del = await User.update({
                        doorpermission: 0
                    }, {
                        where: {
                            usercode
                        }
                    }); //카드 권한 삭제
                } else {
                    console.log(`No card found for cardnum: ${cardnum}`);
                }
            } else {
                client.publish(RESPONSE_TOPIC, '0', (err) => {
                    if (err) {
                        console.error('MQTT publish error', err);
                    }
                }); // 권한이 없으면 0을 보냄
            }
        } catch (err) {
            console.error('Database query error', err);
        }
    }
});

app.listen(4000, () => {
    console.log('Server running on port 4000');
});

client.on('error', (err) => {
    console.error('MQTT connection error:', err);
});