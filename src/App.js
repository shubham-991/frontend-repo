import React, { useState } from 'react';
import ReactPaginate from 'react-paginate';
import axios from 'axios';
import Container from 'react-bootstrap/Container';
import Navbar from 'react-bootstrap/Navbar';
import JSZip from 'jszip';
import GmailInfo from './GmailInfo';

function App() {
  const [keyword, setkeyword] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [fromEmails, setFromEmails] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [showNoMatches, setShowNoMatches] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const validateEmail = (value) => {
    if (!value) {
      setEmailError("Email is required");
    } else if (!/\S+@\S+\.\S+/.test(value)) {
      setEmailError("Invalid email address");
    } else {
      setEmailError("");
    }
  };

  const validatePassword = (value) => {
    if (!value) {
      setPasswordError("Password is required");
    } else if (value.length < 8) {
      setPasswordError("Password must be at least 8 characters long");
    } else {
      setPasswordError("");
    }
  };


  const handlePageChange = ({ selected }) => {
    setCurrentPage(selected);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    const emailInput = document.getElementById("email");
    const emailValue = emailInput.value.trim(); 
    const passwordInput = document.getElementById("password");
    const passwordValue = passwordInput.value.trim();
    const keywordInput = document.getElementById("keyword");
    const keywordValue = keywordInput.value.trim();

    // Check for whitespace in email or password
    if (/\s/.test(emailValue) || /\s/.test(passwordValue)) {
      alert("Email and password should not contain any whitespace.");
      return;
    }

    // Check email and password length
    if (emailValue.length < 1 || passwordValue.length < 1) {
      alert("Please enter email and password.");
      return;
    }

    // Check keyword length
    if (keywordValue.length < 1) {
      alert("Please enter a keyword.");
      return;
    }

    setIsLoading(true);
    setCurrentPage(0); // Reset current page to 0
    try {
      const response = await axios.post('http://flaskapp-env.eba-xqtgwvfg.us-east-1.elasticbeanstalk.com/search', { email: emailValue, password: passwordValue, keyword: keywordValue });
      setSearchResults(response.data);
      const emails = response.data.map((result) => result.from);
      setFromEmails(emails);
      setShowNoMatches(response.data.length === 0);
      console.log(response.data);
    } catch (error) {
      // handle error
    } finally {
      setIsLoading(false);
    }
  };


  //handles download Email FROM
  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([fromEmails.join('\n')], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'from_emails.txt';
    document.body.appendChild(element); // Required for this to work in FireFox
    element.click();
  };

  //download specific attachment
const handleDownloadAttachment = async (message_id, fileName) => {
  try {
    console.log(message_id);
    console.log(fileName);
    const response = await axios.get(`http://flaskapp-env.eba-xqtgwvfg.us-east-1.elasticbeanstalk.com/download_attachment?message_id=${message_id}&file_name=${fileName}&username=${email}&password=${password}`, {
      responseType: 'blob'
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
  } catch (error) {
    // handle error
  }
};


  //Download all the attchments in zip file
  const handleDownloadAll = async () => {
    const fromEmailsWithAttachments = searchResults.filter(result => result.attachments.length > 0);
    if (fromEmailsWithAttachments.length === 0) {
      alert('No attachments found!');
      return;
    }
    setIsLoading(true);
    try {
      const attachmentPromises = fromEmailsWithAttachments.map(async result => {
        const attachmentResponses = await Promise.all(result.attachments.map(async attachment => {
          const response = await axios.get(`http://flaskapp-env.eba-xqtgwvfg.us-east-1.elasticbeanstalk.com/download_attachment?message_id=${result.id}&file_name=${attachment.filename}&username=${email}&password=${password}`, {
            responseType: 'blob'
          });
          return { data: response.data, filename: attachment.filename };
        }));
        return { data: attachmentResponses.map(r => r.data), filenames: attachmentResponses.map(r => r.filename) };
      });
      const attachmentBlobs = await Promise.all(attachmentPromises);
      const zip = new JSZip();
      attachmentBlobs.forEach((attachmentBlob, i) => {
        const emailId = fromEmailsWithAttachments[i].id;
        attachmentBlob.data.forEach((blob, j) => {
          const filename = attachmentBlob.filenames[j];
          zip.folder(`email_${emailId}`).file(filename, blob);
        });
      });
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const element = document.createElement('a');
      element.href = URL.createObjectURL(zipBlob);
      element.download = 'attachments.zip';
      document.body.appendChild(element); // Required for this to work in FireFox
      element.click();
    } catch (error) {
      // handle error
    } finally {
      setIsLoading(false);
    }
  };


  const offset = currentPage * itemsPerPage;
  const currentPageItems = searchResults.slice(offset, offset + itemsPerPage);


  return (
    <div className="App container mt-3">
      <Navbar bg="dark" variant="dark">
        <Container>
          <Navbar.Brand href="#home">
            HireCo
          </Navbar.Brand>
        </Container>
      </Navbar>
      <br/>
      <form onSubmit={handleSearch}>
          <div className="form-group">
            <input
              type="email"
              className={`form-control ${emailError ? "is-invalid" : ""}`}
              id="email"
              placeholder="Enter email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                validateEmail(e.target.value);
              }}
            />
          {emailError && <div className="invalid-feedback">{emailError}</div>}
          </div>
          <br/>
          <div className="form-group">
            <input
              type="password"
              className={`form-control ${passwordError ? "is-invalid" : ""}`}
              id="password"
              placeholder="Password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                validatePassword(e.target.value);
              }}
            />
            {passwordError && (
              <div className="invalid-feedback">{passwordError}</div>
            )}
          </div>

          <br/>
        
        <div className="form-group">
          <input
            type="text"
            className="form-control"
            id="keyword"
            value={keyword}
            placeholder = "Please enter a keyword"
            onChange={(e) => setkeyword(e.target.value)}
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary mt-3"
          disabled={isLoading}
        >
          {isLoading && (
            <span
              className="spinner-border spinner-border-sm mr-2"
              role="status"
              aria-hidden="true"
            ></span>
          )}
          Search
        </button>
      </form>

      <br/>
      
      {(searchResults.length === 0) && <GmailInfo/>}

      
      {(searchResults.length > 0) && (
        <div className="mt-5">
          <div className="d-flex justify-content-center my-2">
            <button className="btn btn-secondary mx-3" onClick={handleDownload}>
              Download FROM emails
            </button>
            <button className="btn btn-secondary mx-3" onClick={handleDownloadAll}>
              Download all attachments
            </button>
          </div>
          <table className="table mt-3">
            <thead className="thead-dark">
              <tr>
                <th>Timestamp</th>
                {/* <th>Thread Count</th> */}
                <th>From</th>
                <th>To</th>
                <th>Subject</th>
                <th>Attachments</th>
              </tr>
            </thead>
            <tbody>
              {currentPageItems.map((result, index) => (
                <tr key={index}>
                  <td>{result.timestamp}</td>
                  {/* <td>{result.threadCount}</td> */}
                  <td>{result.from}</td>
                  <td>{result.to}</td>
                  <td>{result.subject}</td>
                  <td>
                    {result.attachments.map((attachment, i) => (
                      <div key={i}>
                        <button
                          type="button"
                          className="btn btn-link"
                          onClick={() => handleDownloadAttachment(result.id, attachment.filename)}
                        >
                          {attachment.filename}
                        </button>
                      </div>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <br/>
      {/* Conditionally render No Matches message */}
      {searchResults.length === 0 && !isLoading && showNoMatches && (
        <div className="alert alert-warning" role="alert">
          No Matches Found!
        </div>
      )}

      {searchResults.length > 20 &&
      <div  className="d-flex justify-content-center">
        <ReactPaginate
          pageCount={Math.ceil(searchResults.length / itemsPerPage)}
          onPageChange={handlePageChange}
          containerClassName={'pagination'}
          pageClassName={'page-item'}
          pageLinkClassName={'page-link'}
          previousClassName={'page-item'}
          previousLinkClassName={'page-link'}
          nextClassName={'page-item'}
          nextLinkClassName={'page-link'}
          activeClassName={'active'}
        />
        </div>
      }
    </div>
  );
}

export default App;

