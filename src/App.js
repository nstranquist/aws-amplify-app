import { useState, useEffect } from 'react';
import { API, /*Auth*/ } from 'aws-amplify'
import { withAuthenticator, Authenticator } from '@aws-amplify/ui-react'
import { listNotes } from './graphql/queries';
import { createNote as createNoteMutation, deleteNote as deleteNoteMutation } from './graphql/mutations';
import './App.css';
import '@aws-amplify/ui-react/styles.css';

const initialFormState = { name: '', description: '' }

function App() {
  const [notes, setNotes] = useState([]);
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    fetchNotes();
  }, []);

  async function fetchNotes() {
    const apiData = await API.graphql({ query: listNotes });
    setNotes(apiData.data.listNotes.items);
  }

  async function createNote() {
    if (!formData.name || !formData.description) return;
    await API.graphql({ query: createNoteMutation, variables: { input: formData } });
    setNotes([ ...notes, formData ]);
    setFormData(initialFormState);
  }

  async function deleteNote({ id }) {
    const newNotesArray = notes.filter(note => note.id !== id);
    setNotes(newNotesArray);
    await API.graphql({ query: deleteNoteMutation, variables: { input: { id } }});
  }

  return (
    <div className="App">
      <Authenticator>
        {({ signOut, user }) => (
          <div>
            {user && (
              <section>
                <h1>My Notes App</h1>
                <input
                  onChange={e => setFormData({ ...formData, 'name': e.target.value})}
                  placeholder="Note name"
                  value={formData.name}
                />
                <input
                  onChange={e => setFormData({ ...formData, 'description': e.target.value})}
                  placeholder="Note description"
                  value={formData.description}
                />
                <button onClick={createNote}>Create Note</button>
                <div style={{marginBottom: 30}}>
                  {
                    notes.map(note => (
                      <div key={note.id || note.name}>
                        <h2>{note.name}</h2>
                        <p>{note.description}</p>
                        <button onClick={() => deleteNote(note)}>Delete note</button>
                      </div>
                    ))
                  }
                </div>
              </section>
            )}
            <div>
              <p>
                Hey {user.username}, welcome to my channel, with auth!
              </p>
              <button onClick={signOut}>Sign out</button>
            </div>
          </div>
        )}
      </Authenticator>
    </div>
  );
}

export default withAuthenticator(App);
