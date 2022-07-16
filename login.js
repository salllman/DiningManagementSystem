function setFormMessage(formElement, type, message) {
  const messageElement = formElement.querySelector(".formMessage");

  messageElement.textContent = message;
  messageElement.classList.remove("formMessage--success", "formMessage--error");
  messageElement.classList.add(`formMessage--${type}`);
}

function setInputError(inputElement, message) {
  inputElement.classList.add("formInput--error");
  inputElement.parentElement.querySelector(
    ".formInput-error-message"
  ).textContent = message;
}

function clearInputError(inputElement) {
  inputElement.classList.remove("formInput--error");
  inputElement.parentElement.querySelector(
    ".formInput-error-message"
  ).textContent = "";
}

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.querySelector("#login");
  const createAccountForm = document.querySelector("#createAccount");

  document
    .querySelector("#linkCreateAccount")
    .addEventListener("click", (e) => {
      e.preventDefault();
      loginForm.classList.add("form--hidden");
      createAccountForm.classList.remove("form--hidden");
    });

  document.querySelector("#linkLogin").addEventListener("click", (e) => {
    e.preventDefault();
    loginForm.classList.remove("form--hidden");
    createAccountForm.classList.add("form--hidden");
  });

  document.querySelectorAll(".formInput").forEach((inputElement) => {
    inputElement.addEventListener("blur", (e) => {
      if (
        e.target.id === "firstName" &&
        e.target.value.length > 0 &&
        e.target.value.length < 3
      ) {
        setInputError(
          inputElement,
          "First Name must be at least 3 characters in length"
        );
      }
    });

    inputElement.addEventListener("input", (e) => {
      clearInputError(inputElement);
    });
  });
  document.querySelectorAll(".formInput").forEach((inputElement) => {
    inputElement.addEventListener("blur", (e) => {
      if (
        e.target.id === "lastName" &&
        e.target.value.length > 0 &&
        e.target.value.length < 2
      ) {
        setInputError(
          inputElement,
          "Last Name must be at least 2 characters in length"
        );
      }
    });

    inputElement.addEventListener("input", (e) => {
      clearInputError(inputElement);
    });
  });
});
