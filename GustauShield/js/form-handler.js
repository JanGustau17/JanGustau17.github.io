document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.getElementById('contactForm');
    const formStatusMessage = document.getElementById('form-status-message');
    // Assuming your modal might have an ID like 'contact-modal'
    // and the close button has an ID like 'close-modal-btn'
    // Add these if you also want to close the modal on success:
    // const contactModal = document.getElementById('contact-modal'); 
    // const closeModalButton = document.getElementById('close-modal-btn');


    if (contactForm && formStatusMessage) {
        contactForm.addEventListener('submit', function (event) {
            event.preventDefault(); // Prevent default page reload

            const formData = new FormData(contactForm);
            const submitButton = contactForm.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.innerHTML;

            // Optional: Disable button and show "Sending..."
            submitButton.disabled = true;
            submitButton.innerHTML = 'Sending...';
            formStatusMessage.textContent = ''; // Clear previous messages
            formStatusMessage.className = 'text-center mb-3 text-sm'; // Reset classes

            fetch(contactForm.action, {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json' // Important for FormSubmit AJAX
                }
            })
            .then(response => {
                if (response.ok) {
                    return response.json(); // Or response.text() if it doesn't always send JSON on success
                } else {
                    // Try to get error from FormSubmit's JSON response
                    return response.json().then(errData => {
                        throw new Error(errData.message || 'Something went wrong');
                    });
                }
            })
            .then(data => { // Assuming FormSubmit returns some JSON like {success: "true"} or similar
                formStatusMessage.textContent = 'Email sent!';
                formStatusMessage.classList.add('text-green-500'); // Green for success
                contactForm.reset(); // Clear the form fields

                setTimeout(() => {
                    formStatusMessage.textContent = '';
                    formStatusMessage.className = 'text-center mb-3 text-sm'; // Reset classes
                    // Optional: Close the modal
                    // if (contactModal && typeof someFunctionToCloseModal === 'function') {
                    //     someFunctionToCloseModal(); // e.g., contactModal.classList.add('hidden');
                    // }
                    // Or if you have a close button:
                    // if (closeModalButton) closeModalButton.click();
                }, 1500); // Message shown for 1.5 seconds (1000ms = 1 second)
            })
            .catch(error => {
                formStatusMessage.textContent = error.message || 'Oops! There was a problem sending your message.';
                formStatusMessage.classList.add('text-red-500'); // Red for error
                console.error('Form submission error:', error);
                setTimeout(() => {
                    formStatusMessage.textContent = '';
                    formStatusMessage.className = 'text-center mb-3 text-sm'; // Reset classes
                }, 5000); // Keep error message a bit longer
            })
            .finally(() => {
                // Re-enable button
                submitButton.disabled = false;
                submitButton.innerHTML = originalButtonText;
            });
        });
    }

    // Your existing modal open/close logic should still work.
    // For example, if you have something like this in js/main.js or inline:
    const contactFab = document.getElementById('contact-fab');
    const contactModal = document.getElementById('contact-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');

    if (contactFab && contactModal && closeModalBtn) {
        contactFab.addEventListener('click', () => {
            contactModal.classList.remove('hidden');
        });
        closeModalBtn.addEventListener('click', () => {
            contactModal.classList.add('hidden');
            // Clear status message when closing manually
            if (formStatusMessage) {
                 formStatusMessage.textContent = '';
                 formStatusMessage.className = 'text-center mb-3 text-sm';
            }
        });
        // Optional: Close modal if clicking outside the content card
        contactModal.addEventListener('click', (event) => {
            if (event.target === contactModal) {
                contactModal.classList.add('hidden');
                 if (formStatusMessage) {
                    formStatusMessage.textContent = '';
                    formStatusMessage.className = 'text-center mb-3 text-sm';
                }
            }
        });
    }
});
