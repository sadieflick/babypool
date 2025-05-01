$(document).ready(function() {
    // Bootstrap modals
    const selectionModal = new bootstrap.Modal(document.getElementById('selectionModal'));
    const confirmationModal = new bootstrap.Modal(document.getElementById('confirmationModal'));
    const errorModal = new bootstrap.Modal(document.getElementById('errorModal'));
    
    // Load all squares
    loadSquares();
    
    // Function to load squares from the API
    function loadSquares() {
        $.getJSON('/api/squares', function(data) {
            const gridContainer = $('#grid-container');
            gridContainer.empty();
            
            data.forEach(square => {
                const squareElement = $('<div>')
                    .addClass('grid-square')
                    .addClass(square.is_taken ? 'taken' : 'available')
                    .data('number', square.number);
                
                const numberElement = $('<div>')
                    .addClass('square-number')
                    .text(formatTime(square.number));
                
                squareElement.append(numberElement);
                
                if (square.is_taken) {
                    const nameElement = $('<div>')
                        .addClass('square-name')
                        .text(`${square.first_name} ${square.last_initial}.`);
                    
                    squareElement.append(nameElement);
                } else {
                    // Add click event only for available squares
                    squareElement.click(function() {
                        openSelectionModal(square.number);
                    });
                }
                
                gridContainer.append(squareElement);
            });
        });
    }
    
    // Format number as time (0:XX)
    function formatTime(num) {
        return `0:${num < 10 ? '0' + num : num}`;
    }
    
    // Open selection modal
    function openSelectionModal(squareNumber) {
        $('#selected-square').val(squareNumber);
        $('#selectionModalLabel').text(`Select Square (0:${squareNumber < 10 ? '0' + squareNumber : squareNumber})`);
        
        // Reset form
        $('#selectionForm')[0].reset();
        
        selectionModal.show();
    }
    
    // Handle form submission
    $('#confirm-selection').click(function() {
        const form = $('#selectionForm')[0];
        
        // Basic form validation
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }
        
        // Get form data
        const squareNumber = $('#selected-square').val();
        const firstName = $('#first-name').val().trim();
        const lastInitial = $('#last-initial').val().trim().toUpperCase();
        const email = $('#email').val().trim();
        const paymentMethod = $('#payment-method').val();
        
        // Submit selection to API
        $.ajax({
            url: '/api/select-square',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                number: parseInt(squareNumber),
                first_name: firstName,
                last_initial: lastInitial,
                email: email,
                payment_method: paymentMethod
            }),
            success: function(response) {
                selectionModal.hide();
                
                // Show confirmation modal
                confirmationModal.show();
                
                // Reload squares
                loadSquares();
                
                // Add animation to the selected square
                setTimeout(() => {
                    const selectedSquare = $(`.grid-square[data-number="${squareNumber}"]`);
                    selectedSquare.addClass('just-selected');
                    
                    // Remove animation class after animation completes
                    setTimeout(() => {
                        selectedSquare.removeClass('just-selected');
                    }, 1000);
                }, 100);
            },
            error: function(xhr) {
                selectionModal.hide();
                
                // Show error message
                const response = xhr.responseJSON;
                $('#error-message').text(response?.message || 'Something went wrong. Please try again.');
                errorModal.show();
            }
        });
    });
});
                