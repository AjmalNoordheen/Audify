const categoryfilter =async(req,res)=>{
    try{
        // const id = req.query.id
        const {id,search}=req.query
        console.log(search+'==========');
        console.log(id+'==++++++++====');
  
        const loginsession = req.session.user_id
        const  categories = await category.find()
        let productdetails
        if(search!=='undefined'){
            console.log(1);
            console.log(id+'------id');
  
            if(id!='undefined'){
                console.log(id);
                productdetails = await product.find({categories:id,$or:[
                            {name: { $regex: '.' + search + '.', $options: 'i' } },
                            {brand: { $regex: '.' + search + '.', $options: 'i' } },
                        ]})
            }else{
                console.log(3);
                productdetails = await product.find({$or:[
                    {name: { $regex: '.' + search + '.', $options: 'i' } },
                    {brand: { $regex: '.' + search + '.', $options: 'i' } },
                ]})
            }
        }else if(id){
            console.log(12);
            console.log(id+'000000000');
            productdetails = await product.find({categories:id})
            console.log(productdetails);
        }
        
        
        res.send({success:true,products:productdetails})
        // res.render('shop',{productdetails,loginsession,category})
    }
    catch(error){
  
    }
  }