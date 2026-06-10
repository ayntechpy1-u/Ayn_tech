function initSubmitContact() {
  $("#contactForm").on("submit", function (event) {
    event.preventDefault();
    var $successMessage = $("#success-message");
    var $errorMessage = $("#error-message");
    var formData = {
      firstName: $("#firstName").val(),
      lastName: $("#lastName").val(),
      phone: $("#phone").val(),
      email: $("#email").val(),
      serviceNeeded: $("#serviceNeeded").val(),
      budgetRange: $("#budgetRange").val(),
      message: $("#message").val(),
    };
    // Basic validation
    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.email ||
      !formData.serviceNeeded ||
      !formData.budgetRange ||
      !formData.message
    ) {
      $errorMessage.removeClass("hidden");
      $successMessage.addClass("hidden");
      setTimeout(function () {
        $errorMessage.addClass("hidden");
      }, 3000);
      return;
    }
    // Send to Google Apps Script
    $.ajax({
      url: "https://script.google.com/macros/s/AKfycbx8xW_70y4MQsvqaL7e2cgzrZ2FmOkU8SrERrd23CWnxQdiCoTmZ7jDaAGuRgc4a8p8/exec",
      type: "POST",
      dataType: "json",
      data: formData, // Send as form data instead of JSON to avoid CORS preflight
      success: function (response) {
        if (response.success) {
          $successMessage.removeClass("hidden");
          $errorMessage.addClass("hidden");
          $("#contactForm")[0].reset();
          setTimeout(function () {
            $successMessage.addClass("hidden");
          }, 3000);
        } else {
          $errorMessage.removeClass("hidden");
          $successMessage.addClass("hidden");
          setTimeout(function () {
            $errorMessage.addClass("hidden");
          }, 3000);
        }
      },
      error: function (xhr, status, error) {
        console.error("Form submission error:", error);
        $errorMessage.removeClass("hidden");
        $successMessage.addClass("hidden");
        setTimeout(function () {
          $errorMessage.addClass("hidden");
        }, 3000);
      },
    });
  });
}

function initSubmitNewsletter() {
  $("#newsletterForm").on("submit", function (event) {
    event.preventDefault();

    var $email = $("#newsletter-email");
    var $successMessage = $("#newsletter-success");
    var $errorMessage = $("#newsletter-error");
    var $errorText = $email.next(".error-text");

    var isValid = true;

    function validateEmail(email) {
      var pattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      return pattern.test(email);
    }

    if (!$email.val().trim()) {
      $email.addClass("error-border");
      $errorText.removeClass("hidden").text("This field is required");
      isValid = false;
    } else if (!validateEmail($email.val())) {
      $email.addClass("error-border");
      $errorText.text("Invalid email format").removeClass("hidden");
      isValid = false;
    } else {
      $email.removeClass("error-border");
      $errorText.addClass("hidden");
    }

    if (isValid) {
      $successMessage.removeClass("hidden");
      $("#newsletterForm")[0].reset();
      setTimeout(function () {
        $successMessage.addClass("hidden");
      }, 3000);
    } else {
      $errorMessage.removeClass("hidden");
      $("#newsletterForm")[0].reset();
      setTimeout(function () {
        $errorMessage.addClass("hidden");
      }, 3000);
    }
  });
}
