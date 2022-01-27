import { useState, useEffect } from 'react';
import { API, Storage, Auth } from 'aws-amplify'
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

  // useEffect(() => {
  //   console.log("auth user:", Auth.user)
  // }, [Auth.user])

  async function onFileChange(e) {
    if (!e.target.files[0]) return
    const file = e.target.files[0];
    setFormData({ ...formData, image: file.name });
    await Storage.put(file.name, file);
    fetchNotes();
  }

  async function fetchNotes() {
    const apiData = await API.graphql({ query: listNotes });
    const notesFromAPI = apiData.data.listNote.items;
    await Promise.all(notesFromAPI.map(async note => {
      if (note.image) {
        const image = await Storage.get(note.image)
        note.image = image
      }
      return note;
    }))
    setNotes(apiData.data.listNotes.items);
  }

  async function createNote() {
    if (!formData.name || !formData.description) return;
    await API.graphql({ query: createNoteMutation, variables: { input: formData } });
    if(formData.image) {
      const image = await Storage.get(formData.image);
      formData.image = image;
    }
    setNotes([ ...notes, formData ]);
    setFormData(initialFormState);
  }

  async function deleteNote({ id }) {
    const newNotesArray = notes.filter(note => note.id !== id);
    setNotes(newNotesArray);
    await API.graphql({ query: deleteNoteMutation, variables: { input: { id } }});
  }

  const handleSignout = (signOut) => {
    setNotes([])
    setFormData(initialFormState)
    signOut();
    // Auth.signOut()
  }

  return (
    <div className="App">
      <Authenticator>
        {({ signOut, user }) => (
          <div>
            {user && (
              <section>
                <h1>My Notes App</h1>
                <form onSubmit={(e) => {
                  e.preventDefault()
                  createNote()
                }}>
                  <p>
                    <input
                      onChange={e => setFormData({ ...formData, 'name': e.target.value})}
                      placeholder="Note name"
                      value={formData.name}
                    />
                  </p>
                  <p>
                    <input
                      onChange={e => setFormData({ ...formData, 'description': e.target.value})}
                      placeholder="Note description"
                      value={formData.description}
                    />
                  </p>
                  <p>
                    <input type="file" onChange={onFileChange} />
                  </p>
                  <button type="submit">Create Note</button>
                </form>
                <div style={{marginBottom: 30}}>
                  {
                    notes.map(note => (
                      <div key={note.id || note.name}>
                        <h2>{note.name}</h2>
                        <p>{note.description}</p>
                        <button onClick={() => deleteNote(note)}>Delete note</button>
                        {note.image && (
                          <img src={note.image} style={{width: 400}} alt="todo" />
                        )}
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
              <button onClick={() => handleSignout(signOut)}>Sign out</button>
            </div>
          </div>
        )}
      </Authenticator>
    </div>
  );
}

export default withAuthenticator(App);
