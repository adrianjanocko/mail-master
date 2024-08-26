import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import axios from "axios";
import "./App.scss";
import { Icon } from "@iconify/react";
import Dialog from "./Dialog";

async function fetchEmails() {
  try {
    const response = await axios.get("http://localhost:5000/emails");
    return response.data;
  } catch (error) {
    console.error("Error fetching email:", error.response.data);
    throw error;
  }
}

async function addEmail(email, name) {
  try {
    const response = await axios.post(
      "http://localhost:5000/emails",
      { email: email, name: name },
      { headers: { "Content-Type": "application/json" } }
    );
    return response.data;
  } catch (error) {
    console.error("Error adding email:", error.response.data);
    throw error;
  }
}

async function editEmail(oldEmail, newEmail, name) {
  try {
    const response = await axios.put(
      "http://localhost:5000/emails",
      { oldEmail: oldEmail, newEmail: newEmail, name: name },
      { headers: { "Content-Type": "application/json" } }
    );
    return response.data;
  } catch (error) {
    console.error("Error editing email:", error.response.data);
    throw error;
  }
}

async function removeEmail(email) {
  try {
    const response = await axios.delete("http://localhost:5000/emails", {
      data: { email: email },
      headers: { "Content-Type": "application/json" },
    });
    return response.data;
  } catch (error) {
    console.error("Error removing email:", error.response.data);
    throw error;
  }
}

function formatNumberShort(number) {
  const formatter = new Intl.NumberFormat("sk-SK", { notation: "compact" });
  return formatter.format(number);
}

function App() {
  const queryClient = useQueryClient();
  const {
    data: emails = [],
    error,
    isLoading,
  } = useQuery("emails", fetchEmails);

  const addMutation = useMutation(({ email, name }) => addEmail(email, name), {
    onSuccess: () => {
      queryClient.invalidateQueries("emails");
    },
  });

  const editMutation = useMutation(
    ({ oldEmail, newEmail, name }) => editEmail(oldEmail, newEmail, name),
    {
      onSuccess: () => {
        queryClient.invalidateQueries("emails");
      },
    }
  );

  const removeMutation = useMutation((email) => removeEmail(email), {
    onSuccess: () => {
      queryClient.invalidateQueries("emails");
    },
  });

  const [modal, setModal] = useState({ email: "", name: "" });

  function setInput(event) {
    const { name, value } = event.target;
    setModal((prevState) => ({ ...prevState, [name]: value }));
  }

  function handleAdd(event) {
    event.preventDefault();
    addMutation.mutate(modal);
    setModal({ email: "", name: "" });
  }

  function handleEdit(event, email) {
    event.preventDefault();

    editMutation.mutate({
      oldEmail: email.email,
      newEmail: modal.email,
      name: modal.name,
    });
  }

  function handleRemove(email) {
    removeMutation.mutate(email);
  }

  const [selectedEmails, setSelectedEmails] = useState([]);

  function handleCheckboxChange(email) {
    console.log(selectedEmails);

    setSelectedEmails((prevSelectedEmails) => {
      if (prevSelectedEmails.some((e) => e.email === email.email)) {
        // Email is already in the list, remove it
        return prevSelectedEmails.filter((e) => e.email !== email.email);
      } else {
        // Email is not in the list, add it
        return [...prevSelectedEmails, email];
      }
    });
  }

  return (
    <div className="app">
      <h1>E-Mail Automation 😎</h1>
      <div className="stats">
        <div className="stat">
          <div className="stat-figure text-primary">
            <Icon icon="fluent:people-16-regular" width="48px" height="48px" />
          </div>
          <div className="stat-value text-primary text-center">
            {isLoading ? (
              <span className="loading loading-spinner loading-sm"></span>
            ) : (
              formatNumberShort(emails.length)
            )}
          </div>
          <div className="stat-desc">Collected E-Mails</div>
        </div>
      </div>
      <div>
        <button
          className="btn btn-success btn-sm mb-4"
          onClick={() => document.getElementById("modal_Add").showModal()}
        >
          Add
        </button>
        <Dialog
          title="Add"
          handleMethod={handleAdd}
          modal={modal}
          setInput={setInput}
        />
      </div>
      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>
                <label>
                  <input type="checkbox" className="checkbox checkbox-sm" />
                </label>
              </th>
              <th>E-Mail</th>
              <th>Name</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="4" className="text-center">
                  <span className="loading loading-spinner loading-sm"></span>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan="4" className="text-center text-red-500">
                  Error loading emails: {error.message}
                </td>
              </tr>
            ) : (
              emails.map((email) => (
                <tr key={email.email}>
                  <th>
                    <label>
                      <input
                        type="checkbox"
                        className="checkbox checkbox-sm"
                        onChange={() => handleCheckboxChange(email)}
                      />
                    </label>
                  </th>
                  <td>
                    <span className="font-bold">{email.email}</span>
                  </td>
                  <td>{email.name}</td>
                  <th className="flex gap-2 justify-center">
                    <div>
                      <button
                        className="btn btn-outline btn-success btn-xs"
                        onClick={() => {
                          setModal({ email: email.email, name: email.name });
                          document.getElementById("modal_Edit").showModal();
                        }}
                      >
                        Edit
                      </button>
                      <Dialog
                        title="Edit"
                        handleMethod={(event) => handleEdit(event, email)}
                        modal={modal}
                        setInput={setInput}
                      />
                    </div>
                    <button
                      className="btn btn-outline btn-error btn-xs"
                      onClick={() => handleRemove(email.email)}
                    >
                      Remove
                    </button>
                  </th>
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr>
              <th>
                <label>
                  <input type="checkbox" className="checkbox checkbox-sm" />
                </label>
              </th>
              <th>E-Mail</th>
              <th>Name</th>
              <th></th>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

export default App;
