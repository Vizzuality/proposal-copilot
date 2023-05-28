import Alpine from "alpinejs";
Alpine.store("uploadStore", {
  showForm: false,
  title: "",
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
  newSection: function (formId = null) {
    const url = "/new-section";
    let formData;
    if (formId && document.getElementById(formId)) {
      const form = document.getElementById(formId);
      formData = new FormData(form);
    } else {
      formData = new FormData(); // empty FormData object
    }
    return fetch(url, {
      method: "POST",
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.error) {
          document.getElementById("prompt-response").innerText = data["error"];
        } else {
          console.log(data);
          const editorContent = document.getElementById("editor-content"); // get editor-content element
          for (const key in data) {
            // clone template node and remove the id
            const sectionContainer = document
              .getElementById("proposal-section-container")
              .cloneNode(true);
            sectionContainer.removeAttribute("id");
            sectionContainer.id = "section-container-" + key.replace(/ /g, "-"); // unique id for each div

            const sectionDiv =
              sectionContainer.querySelector("#proposal-section");
            sectionDiv.removeAttribute("id");
            sectionDiv.id = "section-div-" + key.replace(/ /g, "-");

            // Create h3 element, set its text content and append it to the proposal section
            const h3 = document.createElement("h3");
            h3.textContent = key;
            sectionDiv.appendChild(h3);

            // Create p element, set its text content and append it to the proposal section
            const p = document.createElement("p");
            p.textContent = data[key]["response"];
            sectionDiv.appendChild(p);

            editorContent.appendChild(sectionContainer); // append the new node to editor-content
          }
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
document
  .getElementById("new-section")
  .addEventListener("submit", function (event) {
    console.log("submit");
    event.preventDefault();
    SingletonFunction.callFunction(
      apiFunctionFactory.newSection,
      "new-section"
    );
  });
document.body.addEventListener("click", function (event) {
  if (event.target.matches(".elaborate")) {
    console.log("elaborate button clicked");
    event.preventDefault();
    SingletonFunction.callFunction(apiFunctionFactory.newSection);
  }
});

document.addEventListener("alpine:init", () => {
  Alpine.data("buttonHandlers", () => ({
    elaborate(event) {
      event.preventDefault();
      console.log("elaborate button clicked");
      // Call your function here
    },
    // Other handlers here
  }));
});

Alpine.start();
