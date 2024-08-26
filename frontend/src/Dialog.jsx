import React from "react";

function Dialog({ title, handleMethod, modal, setInput }) {
  const modalId = `modal_${title}`;

  function handleClose() {
    document.getElementById(modalId).close();
  }

  return (
    <dialog id={modalId} className="modal modal-bottom sm:modal-middle">
      <div className="modal-box">
        <form method="dialog">
          <button
            className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
            onClick={handleClose}
          >
            ✕
          </button>
        </form>
        <h3 className="font-bold text-lg">{title}</h3>
        <form
          className="add--form"
          onSubmit={(event) => {
            handleMethod(event);
            handleClose();
          }}
        >
          <label className="form-control w-full max-w-xs">
            <div className="label">
              <span className="label-text">E-Mail</span>
            </div>
            <input
              type="text"
              placeholder="Type here"
              className="input input-bordered w-full max-w-xs"
              name="email"
              value={modal.email}
              onChange={setInput}
              required
            />
          </label>
          <label className="form-control w-full max-w-xs mb-4">
            <div className="label">
              <span className="label-text">Name</span>
            </div>
            <input
              type="text"
              placeholder="Type here"
              className="input input-bordered w-full max-w-xs"
              name="name"
              value={modal.name}
              onChange={setInput}
              required
            />
          </label>
          <button className="btn btn-success" type="submit">
            {title}
          </button>
        </form>
      </div>
    </dialog>
  );
}

export default Dialog;
