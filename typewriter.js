// typewriter.js

let messages = ["Message 1", "Message 2", "Message 3"];
let currentIndex = 0;

function displayMessage() {
    console.log(messages[currentIndex]);
    currentIndex = (currentIndex + 1) % messages.length;
}

setInterval(displayMessage, 10000); // 10 seconds delay between completions
