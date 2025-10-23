Now, let's go to the ticketing system. 
I can see that some implementation has been made for generating the qr code.
Now, the orders that are shown for every user are all the same, I need that every ticket, and order, correspond to the same user.
How I thought of doing that? 
Well, when a ticket order is placed, then that user gets the qr code, in this qr code, there must be the session of the consumer, the sessions must be kept in a different table inside supabase.
This sessions will correspond to their orders and ticket access. 
As I don't want to implement yet the use of logging into the app, I want to store in the local storage of the user the session, and with that, their data will be retrieved.
For the admins, they will see inside the ticket admin page the option to redeem it, and when it's redeemed, it cannot be used again to ENTER the party, but their qr will still be their session.
When the payment is done, the qr gets generated, and an email is sent to the user with this qr, and also the link to the app with their session activated, so when they're in the party, they can click on the qr and get redirected, or open the email and directly open the link.
In this session they will have all of their orders. 
The session must save the ticket data of that person, so first name, last name, and email.
In the admin dashboard, each ticket should say their first name and last name from that session. 
If by any means the user loses the local storage token, they should be able to access again by their qr or link in the email, BUT the ticket once redeemed cannot be redeemed again.
