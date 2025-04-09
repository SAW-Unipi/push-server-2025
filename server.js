import webPush from "web-push";
import express, { text, json } from "express";
import cors from "cors";

if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    console.log(webPush.generateVAPIDKeys());
    process.exit();
}

webPush.setVapidDetails(
    "https://example.com/",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
);

const app = express();
app.use(text())
app.use(json())
app.use(cors())

const subscriptions = {}; // TODO: use a database!

function sendNotification(subscription) {
    webPush.sendNotification(subscription, JSON.stringify({ text: "Hello from push server!" }))
        .then(() => {
            console.log(`Push Application Server - Notification sent to ${subscription.endpoint}`);
        })
        .catch(() => {
            console.log(`ERROR in sending Notification, endpoint removed ${subscription.endpoint}`);
            delete subscriptions[subscription.endpoint];
        });
}

const pushInterval = 10;
setInterval(() => Object.values(subscriptions).forEach(sendNotification), pushInterval * 1000);

app.get("/vapidPublicKey", (req, res) => {
    res.send(process.env.VAPID_PUBLIC_KEY);
})

app.post("/register", (req, res) => {
    var subscription = req.body.subscription;
    if (!subscriptions[subscription.endpoint]) {
        console.log(`Subscription registered ${subscription.endpoint}`);
        subscriptions[subscription.endpoint] = subscription;
    }
    res.sendStatus(201);
});

app.post("/unregister", (req, res) => {
    var subscription = req.body.subscription;
    if (subscriptions[subscription.endpoint]) {
        console.log("Subscription unregistered " + subscription.endpoint);
        delete subscriptions[subscription.endpoint];
    }
    res.sendStatus(201);
});

app.listen("1234", () => {
    console.log("listening on port 1234")
})