Project Idea:
DriveLab was inspired by the growing need for immersive, interactive, and fun experiences that allow users to virtually explore and engage with vehicles. We found that current online vehicle shopping was often unappealing, so we provided a different solution that would benefit both buyers and dealers. As opposed to the traditional blast of specs that often leave users overwhelmed, we overhauled that method and allowed users to EXPERIENCE those stats. By using custom-built simulation technology, DriveLab is able to bridge the gap between experience and purchase, allowing customers to be more in tune with finding their dream car. Recognizing that many potential customers are unable to experience certain vehicles firsthand due to geographical constraints or other limitations, DriveLab was developed to combat this issue. With a virtual test drive that allows users to interact with a variety of vehicles, DriveLab makes it easy to make comparisons between different models and makes. By leveraging advanced simulation technology, DriveLab offers an inviting opportunity for users that transforms car shopping from an inconvenient and arduous task into the joyride of a lifetime.

Functionality:
DriveLab allows users to compare different Toyota vehicles through a test drive in a game-like environment. Users may browse, read up on, and switch between various models in the display lot, and test drive them on the connected test course. This allows users to compare their various features and driving characteristics through an experience, rather than spec sheets. Through the friendly graphics and smooth movement, users are able to experience a representation of the performance and feel of vehicles in real life. Additionally, a splash screen with price and feature filters helps users narrow down their search for their ideal car. With DriveLab, the differences between cars aren’t just statistics on a screen. Additionally, a splash screen with price and feature filters helps users narrow down their search for their ideal car.

Execution:
We used the modeling Javascript 3D library Three.js to import models into a website built out of HTML/CSS. Blender was used to manipulate and fine-tune both the test drive environment and the vehicle models, and javascript was used to handle vehicle control and response. To create the map of the website, Blender was utilized to incorporate a racetrack, Toyota-like car models, and the natural environment. The physics engine and driving simulator were created using Javascript. Through accessing a database of self-researched Toyota vehicle statistics, we were able to give each car its own acceleration, max speed, steering rate, and max steering angle. With this list, we were also able to better filter vehicle recommendations with more detailed data. We also developed a survey based on research of what we found is most important to families buying a car these days: pricing and safety features/technology.

Challenges:
There were several technical difficulties regarding the physics handling of the vehicle. Since one of the main goals of this simulation was to showcase each vehicle’s unique attributes similar to their real Toyota car counterpart, the acceleration, drag, speed, weight, and other specs had to be scaled down to work properly in our physics environment.

To create a database of different Toyota cars, we also had to implement web scraping to find the statistics of each model, including thorough information so that we could accurately replicate the feel of each vehicle. This took a great deal of time to properly populate the vehicle data with accurate information. Using real-life specs such as weight, horsepower, turning diameter, and even coefficient of drag, we were able to represent the handling of vehicles in a game environment. We also felt that DriveLab would be more useful to the user if the driving characteristics of various vehicles were slightly over-emphasized for easier comparisons. Fine-tuning these characteristics to be a balance of realistic yet distinct proved a great challenge.

Accomplishments:
Driving around is a fun and entertaining experience
Differences between vehicles are showcased, albeit slightly exaggerated
3D models represent their realistic vehicle counterparts
The physics of the driving is intuitive and instinctive
The 3D environment is appealing and inviting
The UI is consistent and detailed throughout the application
We had the time to add hidden features and Easter eggs
This was everyone on the team’s first time working with a 3D environment, however, we all managed to work well together and find different features to work on. In the end, driving around the test track actually turned out to be an extremely enjoyable experience! The differences between the vehicles are also highlighted very well, allowing users to compare various models at different price points. We’re proud of how fast we were able to learn and utilize new software such as Three.js and Blender and have fun along the way, sprinkling in hidden features throughout DriveLab.

Learning Points:
We learned how to utilize 3D modeling within websites using Three.js and simulate a physics engine. We also learned how to work in Blender to customize sizing, create text, modify textures, adjust colors, and construct a 3D map to import into our project. Lastly, we also learned in detail about Toyota’s cars’ features such as their safety features and different models.

Future Goals:
For future iterations of DriveLab, we plan to implement a section for recommended vehicles specific to the user's preferences. Through a quick questionnaire at the beginning of the website, users can find some suggested Toyota cars within the user's price range and have those cars ready to test first. We also would like to add more Toyota models to the car collection, ideally, one day completing their full catalog of cars. Other improvements include better physics implementation with collisions and revised UI for direct comparison tools between individual models, outside of driving performance.

Technology:
javascript, blender, html, css, databases, html, three.js

Credits:
