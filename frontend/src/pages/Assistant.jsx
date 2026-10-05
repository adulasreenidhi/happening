import { useRef, useState } from "react";
import EventCard from "../components/EventCard";
import { sendAssistantMessage } from "../services/assistant";

const SUGGESTIONS = [
  "Find affordable music events this weekend",
  "What technology events are coming up?",
  "Show me events with seats available",
];

function Assistant() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  async function submitMessage(event) {
    event.preventDefault();
    const message = input.trim();
    if (!message || loading) return;

    const history = messages
      .filter((item) => item.role === "user" || item.role === "assistant")
      .slice(-10)
      .map(({ role, content }) => ({ role, content }));
    setMessages((current) => [...current, { role: "user", content: message }]);
    setInput("");
    setError("");
    setLoading(true);

    try {
      const { data } = await sendAssistantMessage(message, history);
      setMessages((current) => [...current, {
        role: "assistant",
        content: data.answer,
        events: data.databaseEvents || [],
        semanticSearchUsed: data.semanticSearchUsed,
      }]);
    } catch (requestError) {
      const messageFromApi = requestError.response?.data?.message;
      setError(messageFromApi || "The assistant could not respond. Please try again.");
      inputRef.current?.focus();
    } finally {
      setLoading(false);
    }
  }

  function startNewConversation() {
    setMessages([]);
    setInput("");
    setError("");
    inputRef.current?.focus();
  }

  return (
    <section className="section assistant-page">
      <header className="assistant-heading">
        <span className="eyebrow"><span className="eyebrow-dot" />HAPPENING AI ASSISTANT</span>
        <h1>Find your next <em>good time.</em></h1>
        <p>Tell us what you’re in the mood for. Recommendations use approved event listings.</p>
      </header>

      <div className="assistant-panel">
        <div className="assistant-panel-heading">
          <div>
            <span className="assistant-status-dot" />
            <strong>Event guide</strong>
            <span>Grounded in HAPPENING listings</span>
          </div>
          {messages.length > 0 && (
            <button type="button" className="assistant-reset" onClick={startNewConversation}>
              New conversation
            </button>
          )}
        </div>

        <div className="assistant-messages" aria-live="polite" aria-busy={loading}>
          {messages.length === 0 ? (
            <div className="assistant-welcome">
              <span className="assistant-welcome-mark" aria-hidden="true">✦</span>
              <h2>What would you like to do?</h2>
              <p>Ask about a city, category, date, budget, or available seats.</p>
              <div className="assistant-suggestions">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => {
                      setInput(suggestion);
                      inputRef.current?.focus();
                    }}
                  >
                    {suggestion}<span aria-hidden="true">↗</span>
                  </button>
                ))}
              </div>
            </div>
          ) : messages.map((item, index) => (
            <article className={`assistant-message assistant-message-${item.role}`} key={`${item.role}-${index}`}>
              <span className="assistant-avatar" aria-hidden="true">{item.role === "assistant" ? "H" : "Y"}</span>
              <div className="assistant-message-content">
                <span className="assistant-message-label">{item.role === "assistant" ? "HAPPENING assistant" : "You"}</span>
                <p>{item.content}</p>
                {item.role === "assistant" && item.events?.length > 0 && (
                  <div className="assistant-grounding">
                    <span>EVENT DETAILS FROM THE DATABASE</span>
                    <div className="events-grid">
                      {item.events.map((eventItem) => <EventCard key={eventItem.id} event={eventItem} />)}
                    </div>
                  </div>
                )}
                {item.role === "assistant" && item.semanticSearchUsed && (
                  <span className="assistant-semantic-note">Matched by meaning and preferences</span>
                )}
              </div>
            </article>
          ))}
          {loading && (
            <div className="assistant-typing" role="status">
              <span className="assistant-avatar" aria-hidden="true">H</span>
              <span>Finding relevant events<span className="typing-dots">...</span></span>
            </div>
          )}
        </div>

        {error && <p className="assistant-error" role="alert">{error}</p>}
        <form className="assistant-composer" onSubmit={submitMessage}>
          <label className="visually-hidden" htmlFor="assistant-message">Message the event assistant</label>
          <input
            id="assistant-message"
            ref={inputRef}
            type="text"
            maxLength={1000}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Try “affordable music events this weekend”"
            disabled={loading}
          />
          <span className="assistant-character-count">{input.length}/1000</span>
          <button type="submit" disabled={loading || !input.trim()} aria-label="Send message">
            {loading ? "…" : "Send"}<span aria-hidden="true">↗</span>
          </button>
        </form>
        <p className="assistant-disclaimer">
          Event names, dates, venues, prices, and availability shown above come from the HAPPENING database.
          AI text is a recommendation, not a booking confirmation.
        </p>
      </div>
    </section>
  );
}

export default Assistant;
