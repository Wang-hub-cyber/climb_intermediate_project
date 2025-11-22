module touch(
     input        clk_50m,      //时钟信号50Mhz
     input        rst_n,    //复位信号
     input        touch_key,    //触摸按键 
  
     output  reg  touch_cnt           //LED灯
 );
 
 //reg define
 reg    touch_key_d0;    //触摸按键端口的数据延迟一个时钟周期
 reg    touch_key_d1;    //触摸按键端口的数据延迟两个时钟周期
 
 //wire define
 wire   touch_en;       //触摸有效脉信号
 
 //*****************************************************
 //**                    main code
 //*****************************************************
 
 //捕获触摸按键端口的上升沿，得到一个时钟周期的脉冲信号
 assign  touch_en = (~touch_key_d1) & touch_key_d0;
 
 //对触摸按键端口的数据延迟两个时钟周期
 always @ (posedge clk_50m or negedge rst_n) begin
     if(!rst_n) begin
         touch_key_d0 <= 1'b0;
         touch_key_d1 <= 1'b0;
     end
     else begin
         touch_key_d0 <= touch_key;
         touch_key_d1 <= touch_key_d0;
     end 
 end
 
 //根据触摸按键上升沿的脉冲信号切换led状态
 always @ (posedge clk_50m or negedge rst_n) begin
     if (!rst_n)
         touch_cnt <= 1'b0;  //复位时默认低电平，禁用读使能       
     else begin 
         if (touch_en)      //检测到触摸按键信号
             touch_cnt <= ~touch_cnt;
     end
 end
 
 endmodule