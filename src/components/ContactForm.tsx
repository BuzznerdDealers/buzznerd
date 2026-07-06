import { useState, type FormEvent } from "react";

type FormState = {
  name: string;
  email: string;
  message: string;
};

const initialState: FormState = {
  name: "",
  email: "",
  message: "",
};

export default function ContactForm() {
  const [form, setForm] = useState<FormState>(initialState);
  const [status, setStatus] = useState<string>("");

  function updateField(field: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("Thanks for reaching out! Our team will get back to you within one business day.");
    setForm(initialState);
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit}>
      <label>
        Name
        <input
          type="text"
          value={form.name}
          onChange={(event) => updateField("name", event.target.value)}
          placeholder="Your name"
          required
        />
      </label>

      <label>
        Email
        <input
          type="email"
          value={form.email}
          onChange={(event) => updateField("email", event.target.value)}
          placeholder="you@example.com"
          required
        />
      </label>

      <label>
        Message
        <textarea
          value={form.message}
          onChange={(event) => updateField("message", event.target.value)}
          placeholder="Tell us what you need"
          rows={5}
          required
        />
      </label>

      <button type="submit">Send Message</button>

      {status && <p className="form-status">{status}</p>}
    </form>
  );
}
