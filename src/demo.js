const express = require("express");
const { PromptableApi } = require("promptable");
require("dotenv").config();
const { Configuration, OpenAIApi } = require("openai");
//const bodyParser = require("body-parser");
const port = 8888;

const app = express();
app.use(express.json());


const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
  organization: "org-WfOXVOg0FFDo1hP7TTbXRnmR"
});


const openai = new OpenAIApi(configuration);
  

app.post("/chat", async (req, res) => {

  const { msg, promptId } = req.body;
  
  if (!msg) {
    res.status(400).json({ error: "Message is required" });
    return;
  }


    if(promptId){

        const promptDeployment = await PromptableApi.getActiveDeployment({
            promptId: promptId,
        });
        const revisedPrompt = {
            ...promptDeployment,
            text: promptDeployment.text.replace("{{input}}",msg),
        };
        console.log("open ai1111",messageList);
        const messageList = [];
        try {
            //将用户输入和系统回答的信息追加到数组
            messageList.push({ role: "user", content: revisedPrompt.text });
            
            const response = await openai.createChatCompletion({
                model: "gpt-3.5-turbo",
                messages:messageList,
                max_tokens: 500,
                temperature:0.8,
              });
                // 将用户输入和系统回答的信息追加到数组中              
            //   messageList.push({ role: "assistant", content: response.data.choices[0].message.content });
              return res.status(200).json({
                success: true,
                data: response.data.choices[0].message.content
              })        
        } catch (error) {
            return res.status(400).json({
                success: false,
                error: error.response
                  ? error.response.data
                  : "服务器出错了",
              });
        }
        
    }else{

        try {
            res.setHeader('Cache-Control', 'no-cache')
            res.setHeader('Content-Type', 'text/event-stream')
            res.setHeader('Access-Control-Allow-Origin', '*')
            res.setHeader('Connection', 'keep-alive')
            res.flushHeaders() // flush the headers to establish SSE with client
            const messageList = [];
            //将用户输入和系统回答的信息追加到数组
            messageList.push({ role: "user", content: msg });
            console.log("open ai222",messageList);
            const response = openai.createChatCompletion({
                model: "gpt-3.5-turbo",
                max_tokens: 3000,
                temperature:0.8,
                messages:messageList,
                stream: true,    //推流模式打开
            }, { responseType: 'stream' })
             response.then(resp => {
                resp.data.on('data', data => {
                const lines = data.toString().split('\n').filter(line => line.trim() !== '')
                //console.log(996, lines)
                for (const line of lines) {
                    const message = line.replace(/^data: /, '')
                    if (message === '[DONE]') {
                        console.log(996, "done")
                        res.end()
                        return
                    }
                    //let strTemp = message
                   // if(strTemp != null){
                        console.log(1188, "data", data)
                        // res.write(data.choices[0].delta.content)
                        res.write(data)
                        //response.pipe(res.data)
                   // }
                }
            })
        })
        } catch (error) {
            return res.status(400).json({
                success: false,
                error: error.response
                  ? error.response.data
                  : "chatgpt服务器出错了",
              });
        }
    }
    

  });


app.get('/clear', (req, res) => {
  // 清空数组
  messageList = [];
  
  // 返回
  res.json({ message: '记忆已清空',data:messageList});
});



  
app.listen(port, () => console.log(`Server listening on port ${port}`));




  
