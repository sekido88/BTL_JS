$(document).ready(function(){
    function performSearch() {
        var searchQuery = $("#content__search input").val().trim();
        if (searchQuery) {
            $.ajax({
                url: "/search_reservation",
                type: "POST",
                data: { search_query: searchQuery },
                success: function(response) {
                    $("#reservations-table").empty();
                    if (response.reservations && response.reservations.length > 0) {
                        response.reservations.forEach(function(reservation) {
                            var statusClass = getStatusClass(reservation.status);
                            var row = `
                                <div class="data-row">
                                    <div class="value">${reservation.name}</div>
                                    <div class="value">${reservation.email}</div>
                                    <div class="value">${reservation.date}<br>${reservation.time}</div>
                                    <div class="value">${reservation.seats}</div>
                                    <div class="value">${reservation.special_requests || 'N/A'}</div>
                                    <div class="value"><span class="status-value ${statusClass}">${reservation.status}</span></div>
                                </div>
                            `;
                            $("#reservations-table").append(row);
                        });
                    } else {
                        $("#reservations-table").append('<div class="no-results">No reservations found.</div>');
                    }
                },
                error: function(xhr, status, error) {
                    console.error("AJAX error:", status, error);
                    alert("An error occurred. Please try again.");
                }
            });
        } else {
            alert("Please enter a search query.");
        }
    }

    function getStatusClass(status) {
        status = status.toLowerCase();
        if (status === 'confirmed') {
            return 'Confirmed';
        } else if (status === 'pending') {
            return 'Pending';
        } else if (status === 'cancelled') {
            return 'Cancelled';
        }
        return '';
    }

    $("#search-btn").click(performSearch);

    $("#content__search input").on("keypress", function(e) {
        if (e.which === 13) { 
            e.preventDefault();
            performSearch();
        }
    });
});