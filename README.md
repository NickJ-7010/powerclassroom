# PowerClassroom
PowerClassroom is a [Brightspace](https://brightspace.aacps.org) alternative for students based on user-interfaces and design techniques from [Google Classroom](https://classroom.google.com). 

## How to install
You can run your own instance of PowerClassroom for free on [render.com](https://render.com) by following the steps below.
<ol>
    <li>Create an account on <a href="https://dashboard.render.com/register">dashboard.render.com/register</a></li>
    <li>Go to <a href="https://dashboard.render.com/web/new">dashboard.render.com/web/new</a> an enter this repository's url <a  href="https://github.com/NickJ-7010/powerclassroom">https://github.com/NickJ-7010/powerclassroom</a> under "Public Git   Repository"</li>
    <li>You should now be in a screen that says "You are deploying a web service for NickJ-7010/powerclassroom." verify that all of the options are correct.
        <ol>
            <li>Pick a name for your service, this will be how you access it. A name of "powerclassroom" would give you a url like <a href="https://powerclassroom.onrender.com">powerclassroom.onrender.com</a> or if the name is already taken it would give you a url like powerclassroom-etfc.onrender.com</li>
            <li>The "Region" can be anywhere but it recommended to be set to "Ohio (US East)"</li>
            <li>The "Branch" has to be "all-in-one" or else it won't have all the features bundled together</li>
            <li>The "Root Directory" has to stay completely blank or you run the risk of it not running properly</li>
            <li>Finally, the "Runtime" has to be set to "Docker" or the project will not load at all</li>
        </ol>
    </li>
    <li>Once you have verified all of the settings scroll down to the bottom and click "Create Web Service"</li>
    <li>It will now bring you to a screen where you can view the URL you will use to connect to your instance of PowerClassroom, make sure to remember it. You will also see a panel where you can view the progress of deploys, your app will auto deploy and update when the repository gets updated.</li>
    <li>From this point your app is fully set up and can be used in a couple of minutes when you see "Your service is live 🎉" in the logs, at that point the app is fully functional and ready for use.</li>
</ol>

This work is licensed under a [Creative Commons Attribution-ShareAlike 4.0 International License](http://creativecommons.org/licenses/by-sa/4.0/).