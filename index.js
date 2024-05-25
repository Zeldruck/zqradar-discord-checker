require('dotenv').config();
const path = require('path');
const express = require("express");
const axios = require("axios");
const url = require('url');
const fs = require("fs");

const HWID = require('./src/HWID');

const port = process.env.PORT || 1500;

const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src', 'views'));
app.use(express.static('public'))

app.get('/api/auth/discord/redirect', async (req, res) => {
    const { code } = req.query;

    if (code)
    {
        const formData = new url.URLSearchParams({
            client_id: process.env.ClientID,
            client_secret: process.env.ClientSecret,
            grant_type: "authorization_code",
            code: code.toString(),
            redirect_uri: `http://localhost:1500/api/auth/discord/redirect`
        });

        const output = await axios.post('https://discord.com/api/oauth2/token', 
            formData,
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );

        if (output.data)
        {
            const access = output.data.access_token;

            const userInfo = await axios.get('https://discord.com/api/users/@me', 
                {
                    headers: {
                        'Authorization': `Bearer ${access}`
                    }
                }
            );

            const userGuilds = await axios.get('https://discord.com/api/users/@me/guilds', 
                {
                    headers: {
                        'Authorization': `Bearer ${access}`
                    }
                }
            );

            const zqradarId = process.env.ZQRadarGuildId;

            const g = userGuilds.data.find((guild) => guild.id == zqradarId);
            
            if (g)
            {
                // TODO
                // Time limit to check again & lock hwid so can't be bypassed
                const hwid = new HWID();
                const hwidStr = await hwid.getHWID();

                if (fs.existsSync('auth.auth.auth'))
                {
                    let auth = fs.readFileSync('auth.auth.auth');

                    auth = auth.toString().replaceAll(new RegExp('\r', 'g'), '').split('\n');

                    if (auth.length > 1)
                    {
                        
                        if (auth[0] != hwidStr)
                        {
                            fs.rmSync('auth.auth.auth');
                            res.render('no-access');
                            return;
                        }

                        // 0 : hwid
                        // 1 : last connect
                        let nFile = hwidStr;
                        nFile += '\n' + (new Date().getUTCMilliseconds().toString());

                        fs.writeFileSync('auth.auth.auth', nFile);
                    }
                    else
                    {
                        fs.rmSync('auth.auth.auth');
                        res.render('no-access');
                        return;
                    }
                }
                else
                {
                    let nFile = hwidStr;
                    nFile += '\n' + (new Date().getUTCMilliseconds().toString());

                    fs.writeFileSync('auth.auth.auth', nFile);
                }

                res.render('index');
            }
            else
            {
                res.render('no-access');
            }
        }
    }
});

var checkServer = app.listen(port, () => {
    console.log(`Running on port ${port}`);
})