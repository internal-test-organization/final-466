const fs = require('fs')
  , path = require('path')
  , core = require('@actions/core')
  , io = require('@actions/io')
  , json2csv = require('json2csv')
  , github = require('@actions/github')
  , githubClient = require('./src/githublib/githubClient')
  , OrganizationActivity = require('./src/OrgsUserActivity')
  , Organization = require('./src/githublib/Organization')
;

async function run() {
  const token = core.getInput('token')
    , outputDir = core.getInput('outputDir')
    , organizationinp = core.getInput('organization')
    , maxRetries = core.getInput('octokit_max_retries')
  ;
console.log(organizationinp)
let regex = /^[\w\.\_\-]+((,|-)[\w\.\_\-]+)*[\w\.\_\-]+$/g;
let validate_org = regex.test(organizationinp);
if((!validate_org)) {
  throw new Error('Provide a valid organization - It accept only comma separated value');
}

let sinceregex = /^(20)\d\d-(0[1-9]|1[012])-([012]\d|3[01])T([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/ 
;

await io.mkdirP(outputDir)

const octokit = githubClient.create(token, maxRetries)
  , orgActivity = new OrganizationActivity(octokit)
  , orgActivity1 = new Organization(octokit)
;



//***start */
let organizationlist = organizationinp.split(',');
let repos = [];
let members = [];
let finaloutput = [];
let orgrepo = [];
let orgrepos = [];
let orgSecret = [];
let orgRepoSecret = [];
let orgRepoName = [];

console.log(organizationlist)
for(const organization of organizationlist){
  console.log(`Attempting to generate ${organization} - user activity data, this could take some time...`);
  const orgsComments = await orgActivity.getOrgsValid(organization);
  if(orgsComments.status !== 'error') {
       
       secrets = await orgActivity1.getOrgSecrets(organization);
       secrets.map(({name}) => {
         console.log(name)
         orgSecret.push(name);  
       })
       for(const item of orgSecret){
        orgrepos = await orgActivity1.getOrgSecretSelectedRepo(organization,item);
        console.log(item,"organization repo")
        console.log(orgrepos)
        for( const orgrepo of orgrepos){
      
          orgRepoName.push(orgrepo);
          console.log(orgRepoName)
          
        }
       }
       for(const item of orgRepoName){
        console.log(item,"organization repo secret")
        orgreposecrets = await orgActivity1.getOrgRepoSecret(organization,item.name);
        for(const orgreposecret of orgreposecrets) {
                orgRepoSecret.push(orgreposecret.name);
        }
       }
       console.log(orgRepoSecret.some(item => orgSecret.includes(item)))
       console.log(orgRepoSecret)
       console.log(orgSecret)
       for(const orepo  of orgRepoName){
        for(const secret  of orgSecret){
          console.log(orepo)
          console.log(secret)
          if (orgRepoSecret.includes(secret)){
            console.log(`Both ${secret} and ${orgRepoSecret} are same.......Retreive repo secret`)
            repoconts = await orgActivity1.getRepoContributor(organization,orepo)
            repoconts.map(({name}) =>{
            console.log(name,"contributor")
            repocont.push(name);
            finaloutput.push({name:orepo,maintainer:name,"org-secrets-overriden":secret,message:"org secrets overriden"})
            })
         } 
         
       
      //  for(const secret of orgSecret) {
      //             orgrepos = await orgActivity1.getOrgSecretSelectedRepo(organization,secret);
      //             console.log(orgrepos)
      //             console.log(secret,"orgsecret")
      //             orgrepos.map(({name}) => {
      //               console.log(name)
      //               orgrepo.push(name);
      //             })
              
      //             let orreposecret = [];
      //             let reposec = [];
      //             let secretlist = [];
      //             let repocont = [];
      //             let repoconts = [];
      //             for(const orepo  of orgrepo){
      //                 reposec = await orgActivity1.getOrgRepoSecret(organization,orepo);
                      
      //                 console.log(reposec,"repository sec")
      //             //     console.log(secret,"secrets organization")
      //              //    console.log(orreposecret,"repository secrets")
                        
      //                   reposec.map(({name}) => {
      //                     console.log(name,"repsec")
      //                     orreposecret.push(name);
      //                   })    
                       
      //               }
                    
                  //  for(const orepo  of orgrepo){
                  //     console.log(orreposecret,"org repos secret")
                  //     console.log(secret,"organization secret")
                  //     if (orreposecret.includes(secret)){
                  //       console.log(`Both ${secret} and ${orreposecret} are same.......Retreive repo secret`)
                  //       repoconts = await orgActivity1.getRepoContributor(organization,orepo)
                  //       repoconts.map(({name}) =>{
                  //       console.log(name,"contributor")
                  //       repocont.push(name);
                  //       finaloutput.push({name:orepo,maintainer:name,"org-secrets-overriden":secret,message:"org secrets overriden"})
                  //       })
                  //      } 
         }
                      
       }  
  }
} 
saveIntermediateData(outputDir, finaloutput);


function saveIntermediateData(directory, data) {
  try {
    const file = path.join(directory, 'org-overriden-secret.json');
    fs.writeFileSync(file, JSON.stringify(data));
    core.setOutput('report_json', file);
  } catch (err) {
    console.error(`Failed to save intermediate data: ${err}`);
  }
}

core.setOutput('repos',orgrepos);
core.setOutput('secret',secrets);
core.setOutput('report',finaloutput);
}

run();