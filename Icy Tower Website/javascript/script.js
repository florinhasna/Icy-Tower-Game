/* ---------------------------------------------- */
/* -----------------MODALS SCRIPT---------------- */
/* ---------------------------------------------- */

// opens how to play modal 
function howToPlayButton() {
    var modal = document.getElementById("insideHowToPlay");
    modal.style.display = "block";
}

// close button to close modal 
function closeButton() {
    var modal = document.getElementById("insideHowToPlay");
    modal.style.display = "none";
}

// opens reset password modal 
function resetButton() {
    var modal = document.getElementById("insideReset");
    modal.style.display = "block";
}

// closes reset button modal 
function closeResetButton() {
    var modal = document.getElementById("insideReset");
    modal.style.display = "none";
}

// opens how to play modal 
function rulesButton() {
    var modal = document.getElementById("insideRules");
    modal.style.display = "block";
}

// close button to close modal 
function closeRulesButton() {
    var modal = document.getElementById("insideRules");
    modal.style.display = "none";
}

/* ---------------------------------------------- */
/* -----------------LOGIN SCRIPT----------------- */
/* ---------------------------------------------- */

// function called whem login button is pressed
function login() {
    const paragraph = document.getElementById("validation");
    // read user input
    const usernameInput = document.querySelector("#usernameField").value;
    const passwordInput = document.querySelector("#passwordField").value;

    if (usernameInput === "" || passwordInput === "") { // if empty fields
        if (usernameInput === "")
            document.getElementById("usernameField").style.backgroundColor = "red";

        if (passwordInput === "")
            document.getElementById("passwordField").style.backgroundColor = "red";

        paragraph.innerHTML = "All fields must be completed...";
        paragraph.style.color = "#FF0000";
    } else { // check inputs
        // call validateLogin to check validity of inputs
        validateLogin(usernameInput, passwordInput, paragraph);
    }
}
// if a key is returned, checks if username and password are correct
function validateLogin(usernameInput, password, paragraph) {
    // to be written if successful or not
    if (localStorage[usernameInput] !== undefined) {
        const accountData = localStorage.getItem(usernameInput); // get the data
        const accountObj = JSON.parse(accountData) // convert to a JSON

        if (password === accountObj.AccountDetails.Password) {
            // login was validated, display green message
            paragraph.innerHTML = "Login successful...";
            paragraph.style.color = "#00ff00";
            sessionStorage.clear(); // will allow only one account at a time
            sessionStorage.setItem(usernameInput, accountData); // set the new account
            window.location.replace("play.html");
        } else {
            // case when password is incorrect, display red message
            paragraph.innerHTML = "Login failed." + "<br>" + "Check your username and password and try again!";
            paragraph.style.color = "#ff0000";
        }
    } else {
        // case when password is incorrect, display red message
        paragraph.innerHTML = "Login failed." + "<br>" + "Check your username and password and try again!";
        paragraph.style.color = "#ff0000";
    }
}
const loggedAccount = sessionStorage.getItem(Object.keys(sessionStorage)[0]);
if (loggedAccount !== null) {
    const loggedObj = JSON.parse(loggedAccount);
    const name = loggedObj.AccountDetails.Username;

    document.getElementById("loginNav").innerHTML = name;
    if (document.URL.includes("login.html")) {
        const loggedMessage = document.getElementById("ifLogged");
        loggedMessage.innerHTML = "You are currently logged as " + name + ". Logging in to another account, will log you out from the current one.";
        loggedMessage.style.color = "#FF0000";
    }
}

/* ---------------------------------------------- */
/* ----------------REGISTER SCRIPT--------------- */
/* ---------------------------------------------- */

// function called in html to run checks and create account if validated
function createAccount() {
    // retrieve input values by id
    const uName = document.querySelector("#uName").value;
    const email = document.querySelector("#email").value;
    const birthday = document.querySelector("#birthday").value;
    const password = document.querySelector("#pass").value;
    const passwordConfirmation = document.querySelector("#confirmPass").value;

    // get the element by ID of the paragraph inside button fieldset
    const confirmationText = document.getElementById("confirmation");

    // validates the inputs, if validated, writes a new key and the data
    if (registerValidation(uName, email, password, passwordConfirmation)) {
        // create JSON object to be written
        const accountInfo = {
            AccountDetails: {
                Username: uName,
                Email: email,
                Birthday: birthday,
                Password: password
            },
            // to hold score by points
            Score: [],
            Difficulty: 0, // default settings for the game
            Color: 0, // default settings for the game
        };

        localStorage[uName] = JSON.stringify(accountInfo);
        // confirmation text 
        confirmationText.innerHTML = "Registration successful. Redirecting ...";
        // change color to red if registration failed
        confirmationText.style.color = "#00FF00";
        window.location.replace("login.html");
    }
}

// to check all inputs
function registerValidation(usernameInput, emailInput, passwordInput, passwordConfirmationInput) {
    // get element to write confirmation to
    const confirmationText = document.getElementById("confirmation");

    // if any fields are empty 
    if (usernameInput === "" || emailInput === "" || passwordInput === "" || passwordConfirmationInput === "") {
        // for every field, if empty set the field red
        if (usernameInput === "")
            document.getElementById("uName").style.backgroundColor = "red";

        if (emailInput === "")
            document.getElementById("email").style.backgroundColor = "red";

        if (passwordInput === "")
            document.getElementById("pass").style.backgroundColor = "red";

        if (passwordConfirmationInput === "")
            document.getElementById("confirmPass").style.backgroundColor = "red";

        confirmationText.innerHTML = "Registration failed!" + "<br>" + "All fields must be completed!";
        confirmationText.style.color = "#FF0000";
        return false;
    } else { //fields were completed,  check inputs

        // regex to validate input
        const uNameRegExp = new RegExp("[a-zA-Z0-9]{3,}"); // validate name
        const emailRegExp = new RegExp("^[a-zA-Z0-9._-]+[@]{1,1}([a-zA-Z]+[.]{1,1})+[a-zA-Z]+$"); // validate email
        const passwordRegExp = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/; // validate password

        // calling another function for each input type 
        // first check username
        if (usernameValidation(usernameInput, uNameRegExp, confirmationText))
            // if validated, check for the email input
            if (emailValidation(emailInput, emailRegExp, confirmationText))
                // if validated, check for the password input
                if (passwordValidation(passwordInput, passwordConfirmationInput, passwordRegExp, confirmationText))
                    return true;

        // change color to red if registration failed
        confirmationText.style.color = "#FF0000";
        return false; // if checks failed
    }
}

// function to validate the username 
function usernameValidation(usernameInput, uNameRegExp, confirmationText) {
    if (!(uNameRegExp.test(usernameInput))) {
        // display error message, make field red 
        confirmationText.innerHTML = "Registration failed!" + "<br>" + "Invalid username format!";
        document.getElementById("uName").style.backgroundColor = "red";
        return false;
    } else if (localStorage[usernameInput] === undefined) {
        return true;
    } else {
        // display error message, make field red 
        confirmationText.innerHTML = "Registration failed!" + "<br>" + "Username already taken!";
        document.getElementById("uName").style.backgroundColor = "red";
        return false;
    }
}

// function to validate email
function emailValidation(emailInput, emailRegExp, confirmationText) {
    // when email format is correct, email is validated
    if (emailRegExp.test(emailInput)) {
        return true;
    } else {
        // display error message, make field red 
        confirmationText.innerHTML = "Registration failed!" + "<br>" + "Invalid email format!";
        document.getElementById("email").style.backgroundColor = "red";
        return false;
    }

}

// function to validate the passwords
function passwordValidation(passwordInput, passwordConfirmationInput, passwordRegExp, confirmationText) {

    if (!(passwordRegExp.test(passwordInput))) { // FAILS THE TEST AGAINST REGEX
        // display error message, make field red 
        confirmationText.innerHTML = "Registration failed!" + "<br>" + "Invalid password format!";
        document.getElementById("pass").style.backgroundColor = "red";
        document.getElementById("confirmPass").style.backgroundColor = "red";
        return false;
    } else { // PASSED
        // check against each other, if matched then is validated
        if (passwordInput === passwordConfirmationInput) {
            return true;
        } else { // PASSWORD AND CONFIRMATION OF PASSWORD DIDN'T MATCHED
            // display error message, make field red 
            confirmationText.innerHTML = "Registration failed!" + "<br>" + "Password mismatch!";
            document.getElementById("pass").style.backgroundColor = "red";
            document.getElementById("confirmPass").style.backgroundColor = "red";
            return false;
        }
    }
}

/* ---------------------------------------------- */
/* --------------LEADERBOARD SCRIPT-------------- */
/* ---------------------------------------------- */

const topFifteen = [];
const accountKeys = Object.keys(localStorage);
if (document.URL.includes("play.html")) { // if on play page
    // as long as there are accounts
    if (localStorage.length > 0) {
        getData(); // retrieves, checks the score and adds it to topFifteen array
        addScore(); // populates the leaderboard
    }

    // save top 15 scores in array
    function getData() {
        for (let i = 0; i < localStorage.length; i++) {
            // get the data
            const currentAccount = accountKeys[i];
            const userData = localStorage.getItem(currentAccount);
            // convert to object
            const userObj = JSON.parse(userData);
            var arrayOfScores = userObj.Score;
            var uName = userObj.AccountDetails.Username;

            // if player has any scores 
            if (arrayOfScores.length > 0) {
                checkScores(arrayOfScores, uName);
            }

            topFifteen.sort(function (a, b) { return a.score - b.score }); // sort
            topFifteen.reverse(function (a, b) { return a.score - b.score }); // reverse for highest to lowest order
            topFifteen.splice(15); // remove extra elements, from index 15 onwards
        }
    }

    // compares the scores of a username against top 15 array
    function checkScores(arrayOfScores, uName) {
        for (let i = 0; i < arrayOfScores.length; i++) {
            if (topFifteen.length === 15) { // when array is complete, compare and add
                for (let j = 0; j < topFifteen.length; j++) {
                    if (topFifteen[j].score < arrayOfScores[i]) {
                        topFifteen.push({
                            uName: uName,
                            score: arrayOfScores[i]
                        });
                        break;
                    }
                }
            } else { // if incomplete, add it anyway
                topFifteen.push({
                    uName: uName,
                    score: arrayOfScores[i]
                });
            }
        }
    }

    // adds the scores to the table
    function addScore() {
        var table = document.getElementById("tableBody");

        // for every object stored in topFifteen array, add a row in the table
        for (let i = 0; i < topFifteen.length; i++) {
            var name = topFifteen[i].uName;
            var score = topFifteen[i].score;
            // create row and cells
            var row = table.insertRow(i);
            var positionCell = row.insertCell(0);
            var userCell = row.insertCell(1);
            var scoreCell = row.insertCell(2);
            // assign the data
            positionCell.innerHTML = i + 1;
            userCell.innerHTML = name;
            scoreCell.innerHTML = score;
        }
    }
}