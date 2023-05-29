import Alpine from "alpinejs";
Alpine.store("uploadStore", {
  showForm: false,
  title: "",
});

// Singleton function
const SingletonFunction = (() => {
  function callFunction(functionCalled, params) {
    console.log("singleton params:");
    console.log(params);
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
  analyzePDF: function (formId = null, formData = null) {
    const url = "/analyze-pdf";
    if (formId && document.getElementById(formId)) {
      const form = document.getElementById(formId);
      formData = new FormData(form);
      formData.append("analysis-type", "new-section");
    } else if (!formData) {
      formData = new FormData(); // create a new empty FormData object if no formId and no formData provided
      console.log("I'm deleting your data");
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
          if (
            formData.get("analysis-type") === "initial-analysis" ||
            formData.get("analysis-type") === "new-section"
          ) {
            parseResponseAndAppendToDOM(data);
            console.log("new section");
          } else {
            data["container-div"] = formData.get("container-div");
            editContentInDOM(data);
            console.log("edit section");
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
    apiFunctionFactory.analyzePDF("new-section");
  });

document.addEventListener("alpine:init", () => {
  Alpine.data("buttonHandlers", () => ({
    elaborate(event) {
      event.preventDefault();
      console.log("elaborate button clicked");
      const buttonData = getButtonData(event.target);
      const formData = new FormData();
      formData.append("section-prompt", buttonData.textContent);
      formData.append("section-title", buttonData.sectionName);
      formData.append("container-div", buttonData.containerDivId);
      formData.append("analysis-type", "elaborate");
      for (var pair of formData.entries()) {
        console.log(pair[0] + ", " + pair[1]);
      }
      apiFunctionFactory.analyzePDF(null, formData);
    },
    // Other handlers here
  }));
});

function getButtonData(button) {
  // Get the closest ancestor div with an id that starts with "section-container-"
  const containerDiv = button.closest('div[id^="section-container-"]');
  const containerDivId = containerDiv.id;
  if (!containerDiv) {
    console.error(
      "Button must be inside a div with an id that starts with 'section-container-'."
    );
    return null;
  }

  // Extract the dynamic section name from the id
  const sectionName = containerDiv.id.slice("section-container-".length);

  // Get the text inside the div
  const textContent = containerDiv.innerText;

  return { sectionName, textContent, containerDivId };
}

function parseResponseAndAppendToDOM(data) {
  console.log("data");
  console.log(data);
  const editorContent = document.getElementById("editor-content");
  for (const key in data) {
    const sectionContainer = document
      .getElementById("proposal-section-container")
      .cloneNode(true);
    sectionContainer.removeAttribute("id");
    sectionContainer.id = "section-container-" + key.replace(/ /g, "-");

    const sectionDiv = sectionContainer.querySelector("#proposal-section");
    sectionDiv.removeAttribute("id");
    sectionDiv.id = "section-div-" + key.replace(/ /g, "-");

    const h3 = document.createElement("h3");
    h3.textContent = key;
    sectionDiv.appendChild(h3);

    const p = document.createElement("p");
    p.textContent = data[key]["response"];
    sectionDiv.appendChild(p);

    editorContent.appendChild(sectionContainer);
  }
}

function editContentInDOM(data) {
  console.log("data");
  console.log(data);

  // Get the existing div using the provided id
  const sectionContainerId = data["container-div"];
  const sectionDivId = sectionContainerId.replace(
    "section-container-",
    "section-div-"
  );

  const sectionDiv = document.getElementById(sectionDivId);

  console.log("sectionDiv");
  console.log(sectionDiv);

  for (const key in data) {
    // Exclude 'container-div' from iteration
    if (key !== "container-div") {
      // Replace the p content
      const p = sectionDiv.getElementsByTagName("p")[0];
      if (p) {
        p.textContent = data[key]["response"]; // assuming the response is the new content for p
      }
    }
  }
}

Alpine.start();
