import { useEffect, useState } from "react";

const palette = ["#ffd27a", "#9af97e", "#ab56f6", "#e05695", "#63c7ff", "#ff8d6b"];

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
      folderSlug: parts[3]
    };
  }

  if (parts[0] === "div" && parts[1]) {
    return {
      blockSlug: parts[1],
      folderSlug: ""
    };
  }

  return {
    blockSlug: "",
    folderSlug: ""
  };
}

export default function App() {
  const [blocks, setBlocks] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [modalMode, setModalMode] = useState("block");
  const [route, setRoute] = useState(getRouteFromLocation);

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

  function handleOpenBlockModal() {
    setDraftName("");
    setModalMode("block");
    setIsModalOpen(true);
  }

  function handleOpenFolderModal() {
    if (!selectedBlock) {
      return;
    }

    setDraftName("");
    setModalMode("folder");
    setIsModalOpen(true);
  }

  function handleOpenTaskModal() {
    if (!selectedBlock || !selectedFolder) {
      return;
    }

    setDraftName("");
    setModalMode("task");
    setIsModalOpen(true);
  }

  function handleCloseModal() {
    setDraftName("");
    setIsModalOpen(false);
  }

  function openBlock(blockSlug) {
    window.history.pushState({}, "", `/div/${blockSlug}`);
    setRoute({
      blockSlug,
      folderSlug: ""
    });
  }

  function openFolder(blockSlug, folderSlug) {
    window.history.pushState({}, "", `/div/${blockSlug}/folder/${folderSlug}`);
    setRoute({
      blockSlug,
      folderSlug
    });
  }

  function goHome() {
    window.history.pushState({}, "", "/");
    setRoute({
      blockSlug: "",
      folderSlug: ""
    });
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
                  ? {
                      ...folder,
                      tasks: folder.tasks.map((task) =>
                        task.id === taskId
                          ? {
                              ...task,
                              done: !task.done
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
                    ? {
                        ...folder,
                        tasks: [
                          ...folder.tasks,
                          {
                            id: `${folder.id}-task-${folder.tasks.length}`,
                            text: draftName.trim(),
                            done: false
                          }
                        ]
                      }
                    : folder
                )
              }
            : block
        )
      );
    }

    handleCloseModal();
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
                      <label className="task-row">
                        <input
                          className="task-checkbox"
                          type="checkbox"
                          checked={task.done}
                          onChange={() => toggleTask(task.id)}
                        />
                        <span className={`task-text${task.done ? " is-done" : ""}`}>{task.text}</span>
                      </label>
                    </li>
                  ))
                ) : (
                  <li className="empty-list-item">
                    <p className="empty-text">No tasks yet. Add your first to-do item.</p>
                  </li>
                )}
              </ul>
            </section>

            <p className="permalink-text">
              Permalink: `/div/{selectedBlock.slug}/folder/{selectedFolder.slug}`
            </p>

            <button className="bottom-add-button" type="button" onClick={handleOpenTaskModal}>
              Add task
            </button>
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
                    </li>
                  ))
                ) : (
                  <li className="empty-list-item">
                    <p className="empty-text">No folders yet. Add one like "Global tasks".</p>
                  </li>
                )}
              </ul>
            </div>

            <p className="permalink-text">Permalink: `/div/{selectedBlock.slug}`</p>

            <button className="bottom-add-button" type="button" onClick={handleOpenFolderModal}>
              Add folder
            </button>
          </section>
        ) : (
          <section className="blocks-grid">
            {blocks.map((block) => (
              <article className="block-card" key={block.id}>
                <p className="block-title">{block.name}</p>
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
                    <span className="block-open-text">Open</span>
                  </div>
                </button>
              </article>
            ))}
          </section>
        )}

        {selectedBlock ? null : (
          <button className="add-button" type="button" onClick={handleOpenBlockModal}>
            Add div
          </button>
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
                  : `Add task to ${selectedFolder?.name ?? ""}`}
            </h2>

            <form className="modal-form" onSubmit={handleCreateBlock}>
              <label className="modal-label" htmlFor="div-name">
                {modalMode === "block"
                  ? "Div name"
                  : modalMode === "folder"
                    ? "Folder name"
                    : "Task name"}
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
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
