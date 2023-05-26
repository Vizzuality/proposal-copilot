import Alpine from "alpinejs";
Alpine.store("uploadStore", {
  showForm: false,
  title: "Thomsom Okanagan Platform",
});

// Singleton function
const SingletonFunction = (() => {
  function callFunction(functionCalled, params) {
    return functionCalled(params);
  }

  return {
    callFunction: callFunction,
  };
})();

// Factory for API call functions
const apiFunctionFactory = {
  uploadFile: function (params) {
    const url = "/pdf-upload";
    const formData = new FormData();
    formData.append("file", params.file);

    return fetch(url, {
      method: "POST",
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.error) {
          document.getElementById("upload-response").innerText = data["error"];
        } else {
          console.log(data["response"]);
          Alpine.store("uploadStore").showForm = false;
          console.log(Alpine.store("uploadStore").showForm);
          Alpine.store("uploadStore").title = data["response"];
          console.log(Alpine.store("uploadStore").title);
        }
        return data;
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  },
};

document.getElementById("upload-form").addEventListener("submit", function (e) {
  e.preventDefault();
});
// Dragover handler to set the drop effect.
document
  .getElementById("upload-form")
  .addEventListener("dragover", function (e) {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
  });

// Drop handler to get the files.
document.getElementById("upload-form").addEventListener("drop", function (e) {
  e.preventDefault();
  e.stopPropagation();
  const files = e.dataTransfer.files;
  if (files.length > 0) {
    SingletonFunction.callFunction(apiFunctionFactory.uploadFile, {
      file: files[0],
    });
  }
});

document.getElementById("file-upload").addEventListener("change", function (e) {
  e.preventDefault();
  const files = e.target.files;
  if (files.length > 0) {
    SingletonFunction.callFunction(apiFunctionFactory.uploadFile, {
      file: files[0],
    });
  }
});
Alpine.start();
