import { useEffect, useState } from "react";

const palette = ["#ffd27a", "#9af97e", "#ab56f6", "#e05695", "#63c7ff", "#ff8d6b"];
const STORAGE_KEY = "jenya-app-data";

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function getBlockSlug(name, index) {
  const baseSlug = slugify(name) || "div";
  return `${baseSlug}-${index + 1}`;
}

function getFolderSlug(name, index) {
  const baseSlug = slugify(name) || "folder";
  return `${baseSlug}-${index + 1}`;
}

function getRouteFromLocation() {
  const parts = window.location.pathname.split("/").filter(Boolean);

  if (parts[0] === "div" && parts[1] && parts[2] === "folder" && parts[3]) {
    return {
      blockSlug: parts[1],
      folderSlug: parts[3],
      view: "app"
    };
  }

  if (parts[0] === "div" && parts[1]) {
    return {
      blockSlug: parts[1],
      folderSlug: "",
      view: "app"
    };
  }

  return {
    blockSlug: "",
    folderSlug: "",
    view: "app"
  };
}

export default function App() {
  const [blocks, setBlocks] = useState(() => {
    const savedValue = window.localStorage.getItem(STORAGE_KEY);

    if (!savedValue) {
      return [];
    }

    try {
      const parsedValue = JSON.parse(savedValue);
      return Array.isArray(parsedValue) ? parsedValue : [];
    } catch {
      return [];
    }
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [modalMode, setModalMode] = useState("block");
  const [route, setRoute] = useState(getRouteFromLocation);
  const [isEditing, setIsEditing] = useState(false);
  const [editingTarget, setEditingTarget] = useState(null);

  const selectedBlock = blocks.find((block) => block.slug === route.blockSlug) ?? null;
  const selectedFolder =
    selectedBlock?.folders.find((folder) => folder.slug === route.folderSlug) ?? null;

  useEffect(() => {
    function handlePopState() {
      setRoute(getRouteFromLocation());
    }

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(blocks));
  }, [blocks]);

  function handleOpenBlockModal() {
    setDraftName("");
    setModalMode("block");
    setEditingTarget(null);
    setIsModalOpen(true);
  }

  function handleOpenFolderModal() {
    if (!selectedBlock) {
      return;
    }

    setDraftName("");
    setModalMode("folder");
    setEditingTarget(null);
    setIsModalOpen(true);
  }

  function handleOpenTaskModal() {
    if (!selectedBlock || !selectedFolder) {
      return;
    }

    setDraftName("");
    setModalMode("task");
    setEditingTarget(null);
    setIsModalOpen(true);
  }

  function handleOpenEditBlockModal(block) {
    setDraftName(block.name);
    setModalMode("edit-block");
    setEditingTarget({ id: block.id });
    setIsModalOpen(true);
  }

  function handleOpenEditFolderModal(folder) {
    setDraftName(folder.name);
    setModalMode("edit-folder");
    setEditingTarget({ id: folder.id });
    setIsModalOpen(true);
  }

  function handleOpenEditTaskModal(task) {
    setDraftName(task.text);
    setModalMode("edit-task");
    setEditingTarget({ id: task.id });
    setIsModalOpen(true);
  }

  function handleCloseModal() {
    setDraftName("");
    setEditingTarget(null);
    setIsModalOpen(false);
  }

  function openBlock(blockSlug) {
    window.history.pushState({}, "", `/div/${blockSlug}`);
    setRoute({
      blockSlug,
      folderSlug: "",
      view: "app"
    });
    setIsEditing(false);
  }

  function openFolder(blockSlug, folderSlug) {
    window.history.pushState({}, "", `/div/${blockSlug}/folder/${folderSlug}`);
    setRoute({
      blockSlug,
      folderSlug,
      view: "app"
    });
    setIsEditing(false);
  }

  function goHome() {
    window.history.pushState({}, "", "/");
    setRoute({
      blockSlug: "",
      folderSlug: "",
      view: "app"
    });
    setIsEditing(false);
  }

  function goToBlock() {
    if (!selectedBlock) {
      goHome();
      return;
    }

    openBlock(selectedBlock.slug);
  }

  function toggleTask(taskId) {
    if (!selectedBlock || !selectedFolder) {
      return;
    }

    setBlocks((currentBlocks) =>
      currentBlocks.map((block) =>
        block.slug === selectedBlock.slug
          ? {
              ...block,
              folders: block.folders.map((folder) =>
                folder.slug === selectedFolder.slug
                  ? (() => {
                      const updatedTasks = folder.tasks.map((task) =>
                        task.id === taskId
                          ? {
                              ...task,
                              done: !task.done
                            }
                          : task
                      );

                      const activeTasks = updatedTasks.filter((task) => !task.done);
                      const completedTasks = updatedTasks.filter((task) => task.done);

                      return {
                        ...folder,
                        tasks: [...activeTasks, ...completedTasks]
                      };
                    })()
                  : folder
              )
            }
          : block
      )
    );
  }

  function deleteBlock(blockId) {
    setBlocks((currentBlocks) => currentBlocks.filter((block) => block.id !== blockId));
  }

  function deleteFolder(folderId) {
    if (!selectedBlock) {
      return;
    }

    setBlocks((currentBlocks) =>
      currentBlocks.map((block) =>
        block.slug === selectedBlock.slug
          ? {
              ...block,
              folders: block.folders.filter((folder) => folder.id !== folderId)
            }
          : block
      )
    );
  }

  function deleteTask(taskId) {
    if (!selectedBlock || !selectedFolder) {
      return;
    }

    setBlocks((currentBlocks) =>
      currentBlocks.map((block) =>
        block.slug === selectedBlock.slug
          ? {
              ...block,
              folders: block.folders.map((folder) =>
                folder.slug === selectedFolder.slug
                  ? {
                      ...folder,
                      tasks: folder.tasks.filter((task) => task.id !== taskId)
                    }
                  : folder
              )
            }
          : block
      )
    );
  }

  function handleCreateBlock(event) {
    event.preventDefault();

    if (!draftName.trim()) {
      return;
    }

    if (modalMode === "block") {
      setBlocks((currentBlocks) => [
        ...currentBlocks,
        {
          id: `${Date.now()}-${currentBlocks.length}`,
          name: draftName.trim(),
          color: palette[currentBlocks.length % palette.length],
          folders: [],
          slug: getBlockSlug(draftName.trim(), currentBlocks.length)
        }
      ]);
    }

    if (modalMode === "folder" && selectedBlock) {
      setBlocks((currentBlocks) =>
        currentBlocks.map((block) =>
          block.slug === selectedBlock.slug
            ? {
                ...block,
                folders: [
                  ...block.folders,
                  {
                    id: `${block.id}-folder-${block.folders.length}`,
                    name: draftName.trim(),
                    slug: getFolderSlug(draftName.trim(), block.folders.length),
                    tasks: []
                  }
                ]
              }
            : block
        )
      );
    }

    if (modalMode === "task" && selectedBlock && selectedFolder) {
      setBlocks((currentBlocks) =>
        currentBlocks.map((block) =>
          block.slug === selectedBlock.slug
            ? {
                ...block,
                folders: block.folders.map((folder) =>
                  folder.slug === selectedFolder.slug
                    ? (() => {
                        const newTask = {
                          id: `${folder.id}-task-${folder.tasks.length}`,
                          text: draftName.trim(),
                          done: false
                        };
                        const activeTasks = folder.tasks.filter((task) => !task.done);
                        const completedTasks = folder.tasks.filter((task) => task.done);

                        return {
                          ...folder,
                          tasks: [...activeTasks, newTask, ...completedTasks]
                        };
                      })()
                    : folder
                )
              }
            : block
        )
      );
    }

    if (modalMode === "edit-block" && editingTarget) {
      const nextName = draftName.trim();

      setBlocks((currentBlocks) => {
        const nextBlocks = currentBlocks.map((block, index) =>
          block.id === editingTarget.id
            ? {
                ...block,
                name: nextName,
                slug: getBlockSlug(nextName, index)
              }
            : block
        );
        const updatedBlock = nextBlocks.find((block) => block.id === editingTarget.id);

        if (updatedBlock && route.blockSlug) {
          window.history.pushState({}, "", `/div/${updatedBlock.slug}`);
          setRoute({
            blockSlug: updatedBlock.slug,
            folderSlug: ""
          });
        }

        return nextBlocks;
      });
    }

    if (modalMode === "edit-folder" && selectedBlock && editingTarget) {
      const nextName = draftName.trim();

      setBlocks((currentBlocks) => {
        const nextBlocks = currentBlocks.map((block) =>
          block.slug === selectedBlock.slug
            ? {
                ...block,
                folders: block.folders.map((folder, index) =>
                  folder.id === editingTarget.id
                    ? {
                        ...folder,
                        name: nextName,
                        slug: getFolderSlug(nextName, index)
                      }
                    : folder
                )
              }
            : block
        );
        const updatedBlock = nextBlocks.find((block) => block.slug === selectedBlock.slug);
        const updatedFolder = updatedBlock?.folders.find((folder) => folder.id === editingTarget.id);

        if (updatedBlock && updatedFolder && route.folderSlug) {
          window.history.pushState({}, "", `/div/${updatedBlock.slug}/folder/${updatedFolder.slug}`);
          setRoute({
            blockSlug: updatedBlock.slug,
            folderSlug: updatedFolder.slug
          });
        }

        return nextBlocks;
      });
    }

    if (modalMode === "edit-task" && selectedBlock && selectedFolder && editingTarget) {
      const nextName = draftName.trim();

      setBlocks((currentBlocks) =>
        currentBlocks.map((block) =>
          block.slug === selectedBlock.slug
            ? {
                ...block,
                folders: block.folders.map((folder) =>
                  folder.slug === selectedFolder.slug
                    ? {
                        ...folder,
                        tasks: folder.tasks.map((task) =>
                          task.id === editingTarget.id
                            ? {
                                ...task,
                                text: nextName
                              }
                            : task
                        )
                      }
                    : folder
                )
              }
            : block
        )
      );
    }

    handleCloseModal();
    setIsEditing(false);
  }

  return (
    <>
      <main className="canvas">
        {selectedBlock && selectedFolder ? (
          <section className="detail-screen">
            <header className="detail-header">
              <button
                className="back-icon-button"
                type="button"
                onClick={goToBlock}
                aria-label="Go back"
              >
                &larr;
              </button>
              <h1 className="detail-title">{selectedFolder.name}</h1>
            </header>

            <section className="folder-detail-card">
              <p className="panel-label">To-do list</p>
              <p className="folder-detail-parent">Inside {selectedBlock.name}</p>

              <ul className="tasks-list">
                {selectedFolder.tasks.length > 0 ? (
                  selectedFolder.tasks.map((task) => (
                    <li className="task-list-item" key={task.id}>
                      <div className="task-row">
                        <span className={`task-text${task.done ? " is-done" : ""}`}>{task.text}</span>
                        {isEditing ? (
                          <div className="inline-actions">
                            <button
                              className="inline-edit-button"
                              type="button"
                              onClick={() => handleOpenEditTaskModal(task)}
                            >
                              Edit
                            </button>
                            <button
                              className="inline-delete-button"
                              type="button"
                              onClick={() => deleteTask(task.id)}
                            >
                              Delete
                            </button>
                          </div>
                        ) : null}
                        <input
                          className="task-checkbox"
                          type="checkbox"
                          checked={task.done}
                          onChange={() => toggleTask(task.id)}
                        />
                      </div>
                    </li>
                  ))
                ) : (
                  <li className="empty-list-item">
                    <p className="empty-text">No tasks yet. Add your first to-do item.</p>
                  </li>
                )}
              </ul>
            </section>

            <div className="bottom-actions">
              <button className="bottom-secondary-button" type="button" onClick={() => setIsEditing((value) => !value)}>
                <svg
                  className="edit-icon"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    d="M4 15.5V20h4.5L19 9.5 14.5 5 4 15.5Zm12.8-9.8 1.7-1.7a1.2 1.2 0 0 1 1.7 0l1.8 1.8a1.2 1.2 0 0 1 0 1.7L20.3 9l-3.5-3.3Z"
                    fill="currentColor"
                  />
                </svg>
              </button>
              <button className="bottom-add-button" type="button" onClick={handleOpenTaskModal}>
                Add task
              </button>
            </div>
          </section>
        ) : selectedBlock ? (
          <section className="detail-screen">
            <header className="detail-header">
              <button className="back-icon-button" type="button" onClick={goHome} aria-label="Go back">
                &larr;
              </button>
              <h1 className="detail-title">{selectedBlock.name}</h1>
            </header>

            <div className="folders-list-wrapper">
              <p className="panel-label">Folders</p>

              <ul className="folders-list">
                {selectedBlock.folders.length > 0 ? (
                  selectedBlock.folders.map((folder) => (
                    <li className="folder-list-item" key={folder.id}>
                      <div className="folder-row-shell">
                        <button
                          className="folder-row-button"
                          type="button"
                          onClick={() => openFolder(selectedBlock.slug, folder.slug)}
                        >
                          <span className="folder-row-left">
                            <span className="folder-icon" aria-hidden="true">
                              +
                            </span>
                            <span>{folder.name}</span>
                          </span>
                          <span className="folder-arrow" aria-hidden="true">
                            &rsaquo;
                          </span>
                        </button>
                        {isEditing ? (
                          <div className="inline-actions">
                            <button
                              className="inline-edit-button"
                              type="button"
                              onClick={() => handleOpenEditFolderModal(folder)}
                            >
                              Edit
                            </button>
                            <button
                              className="inline-delete-button"
                              type="button"
                              onClick={() => deleteFolder(folder.id)}
                            >
                              Delete
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </li>
                  ))
                ) : (
                  <li className="empty-list-item">
                    <p className="empty-text">No folders yet. Add one like "Global tasks".</p>
                  </li>
                )}
              </ul>
            </div>

            <div className="bottom-actions">
              <button className="bottom-secondary-button" type="button" onClick={() => setIsEditing((value) => !value)}>
                <svg
                  className="edit-icon"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    d="M4 15.5V20h4.5L19 9.5 14.5 5 4 15.5Zm12.8-9.8 1.7-1.7a1.2 1.2 0 0 1 1.7 0l1.8 1.8a1.2 1.2 0 0 1 0 1.7L20.3 9l-3.5-3.3Z"
                    fill="currentColor"
                  />
                </svg>
              </button>
              <button className="bottom-add-button" type="button" onClick={handleOpenFolderModal}>
                Add folder
              </button>
            </div>
          </section>
        ) : (
          <section className="blocks-grid">
            {blocks.map((block) => (
              <article className="block-card" key={block.id}>
                <div className="block-header-row">
                  <p className="block-title">{block.name}</p>
                  {isEditing ? (
                    <div className="inline-actions">
                      <button
                        className="inline-edit-button"
                        type="button"
                        onClick={() => handleOpenEditBlockModal(block)}
                      >
                        Edit
                      </button>
                      <button
                        className="inline-delete-button"
                        type="button"
                        onClick={() => deleteBlock(block.id)}
                      >
                        Delete
                      </button>
                    </div>
                  ) : null}
                </div>
                <button
                  className="color-block"
                  type="button"
                  style={{ backgroundColor: block.color }}
                  onClick={() => openBlock(block.slug)}
                >
                  <div className="block-content">
                    {block.folders.length > 0 ? (
                      <ul className="block-preview-list">
                        {block.folders.slice(0, 3).map((folder) => (
                          <li className="block-preview-item" key={folder.id}>
                            {folder.name}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="block-preview-empty">No folders yet</p>
                    )}
                  </div>
                </button>
              </article>
            ))}
          </section>
        )}

        {selectedBlock ? null : (
          <div className="bottom-actions bottom-actions-home">
            <button className="bottom-secondary-button" type="button" onClick={() => setIsEditing((value) => !value)}>
              <svg
                className="edit-icon"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  d="M4 15.5V20h4.5L19 9.5 14.5 5 4 15.5Zm12.8-9.8 1.7-1.7a1.2 1.2 0 0 1 1.7 0l1.8 1.8a1.2 1.2 0 0 1 0 1.7L20.3 9l-3.5-3.3Z"
                  fill="currentColor"
                />
              </svg>
            </button>
            <button className="add-button" type="button" onClick={handleOpenBlockModal}>
              Add div
            </button>
          </div>
        )}
      </main>

      {isModalOpen ? (
        <div className="modal-overlay" role="presentation" onClick={handleCloseModal}>
          <div
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-div-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="modal-title" id="create-div-title">
              {modalMode === "block"
                ? "Create div"
                : modalMode === "folder"
                  ? `Add folder to ${selectedBlock?.name ?? ""}`
                  : modalMode === "task"
                    ? `Add task to ${selectedFolder?.name ?? ""}`
                    : modalMode === "edit-block"
                      ? "Edit div"
                      : modalMode === "edit-folder"
                        ? "Edit folder"
                        : "Edit task"}
            </h2>

            <form className="modal-form" onSubmit={handleCreateBlock}>
              <label className="modal-label" htmlFor="div-name">
                {modalMode === "block"
                  ? "Div name"
                  : modalMode === "folder"
                    ? "Folder name"
                    : modalMode === "task"
                      ? "Task name"
                      : modalMode === "edit-block"
                        ? "New div name"
                        : modalMode === "edit-folder"
                          ? "New folder name"
                          : "New task name"}
              </label>
              <input
                id="div-name"
                className="modal-input"
                type="text"
                value={draftName}
                onChange={(event) => setDraftName(event.target.value)}
                autoFocus
              />

              <div className="modal-actions">
                <button className="modal-secondary" type="button" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button className="modal-primary" type="submit">
                  {modalMode.startsWith("edit-") ? "Save" : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
