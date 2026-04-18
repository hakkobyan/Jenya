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

function getSlugFromLocation() {
  const [, section, slug] = window.location.pathname.split("/");
  return section === "div" ? slug ?? "" : "";
}

export default function App() {
  const [blocks, setBlocks] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [modalMode, setModalMode] = useState("block");
  const [activeSlug, setActiveSlug] = useState(getSlugFromLocation);

  const selectedBlock = blocks.find((block) => block.slug === activeSlug) ?? null;

  useEffect(() => {
    function handlePopState() {
      setActiveSlug(getSlugFromLocation());
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

  function handleCloseModal() {
    setDraftName("");
    setIsModalOpen(false);
  }

  function openBlock(slug) {
    window.history.pushState({}, "", `/div/${slug}`);
    setActiveSlug(slug);
  }

  function goHome() {
    window.history.pushState({}, "", "/");
    setActiveSlug("");
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
                    name: draftName.trim()
                  }
                ]
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
        {selectedBlock ? (
          <section className="folders-panel">
            <button className="back-button" type="button" onClick={goHome}>
              Back
            </button>

            <div className="folders-header">
              <div>
                <p className="panel-label">Inside</p>
                <h2 className="panel-title">{selectedBlock.name}</h2>
              </div>
              <button className="panel-button" type="button" onClick={handleOpenFolderModal}>
                Add folder
              </button>
            </div>

            <div className="folders-list">
              {selectedBlock.folders.length > 0 ? (
                selectedBlock.folders.map((folder) => (
                  <div className="folder-chip" key={folder.id}>
                    <span className="folder-icon" aria-hidden="true">
                      +
                    </span>
                    <span>{folder.name}</span>
                  </div>
                ))
              ) : (
                <p className="empty-text">No folders yet. Add one like “Global tasks”.</p>
              )}
            </div>

            <p className="permalink-text">Permalink: `/div/{selectedBlock.slug}`</p>
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
                  <span className="block-open-text">Open</span>
                </button>
              </article>
            ))}
          </section>
        )}

        <button className="add-button" type="button" onClick={handleOpenBlockModal}>
          Add div
        </button>
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
              {modalMode === "block" ? "Create div" : `Add folder to ${selectedBlock?.name ?? ""}`}
            </h2>

            <form className="modal-form" onSubmit={handleCreateBlock}>
              <label className="modal-label" htmlFor="div-name">
                {modalMode === "block" ? "Div name" : "Folder name"}
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
