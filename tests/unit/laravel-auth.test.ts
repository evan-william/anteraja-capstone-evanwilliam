import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
const php = existsSync('C:/xampp/php/php.exe') ? 'C:/xampp/php/php.exe' : 'php';
describe('Laravel auth cache', () => {
  it('refreshes the role after successful admin activation in the same request', () => {
    const code = `
      require 'backend/app/Support/SessionState.php';
      require 'backend/app/Domain/Auth.php';
      App\\Support\\SessionState::$data=['access_token'=>'fixture-token','expires_at'=>time()+3600];
      function app_log_actor($id,$role) {}
      function app_log($event,$details=[]) {}
      function supabase_request($method,$path,$body=null,$headers=[],$token=null) { return ['status'=>200,'data'=>['id'=>'fixture-user']]; }
      function supabase_table($table,$query,$token) {
        return ['status'=>200,'data'=>[$table==='users'?['id'=>'fixture-user','email'=>'fixture@example.test','name'=>'Fixture']:['role'=>($GLOBALS['activated']??false)?'admin':'consumer']]];
      }
      function supabase_rpc($name,$args,$token) { $GLOBALS['activated']=true; return ['status'=>200,'data'=>true]; }
      function api_ok($data,$status=200) { echo json_encode($data); exit; }
      current_user(); activate_admin(['code'=>'fixture-activation-code']);
    `;
    const result=spawnSync(php,['-r',code],{encoding:'utf8'});
    expect(result.status,result.stderr).toBe(0);
    expect(JSON.parse(result.stdout).role).toBe('admin');
  });
});
